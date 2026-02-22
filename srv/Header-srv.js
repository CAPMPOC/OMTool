// const cds = require('@sap/cds');

// module.exports = cds.service.impl(async function () {
//     const { EmployeeHeader } = this.entities;

//     // ==================== CONSTANTS ====================

//     const FieldControl = {
//         HIDDEN: 0,
//         READONLY: 1,
//         OPTIONAL: 3,
//         MANDATORY: 7
//     };

//     // ==================== HELPER FUNCTIONS ====================

//     /**
//      * Check if the record is older than 3 months from RollOnDate
//      */
//     function isOlderThanThreeMonths(rollOnDate) {
//         if (!rollOnDate) return false;

//         const rollOn = new Date(rollOnDate);
//         const today = new Date();

//         const monthsDiff = (today.getFullYear() - rollOn.getFullYear()) * 12
//             + (today.getMonth() - rollOn.getMonth());

//         return monthsDiff >= 3;
//     }

//     /**
//      * Get today's date in ISO format (YYYY-MM-DD)
//      */
//     function getTodayDate() {
//         return new Date().toISOString().split('T')[0];
//     }

//     /**
//      * Validate RollOffDate against RollOnDate
//      * @param {string|Date} rollOffDate 
//      * @param {string|Date} rollOnDate 
//      * @returns {boolean} - Returns true if valid, false if invalid
//      */
//     function isRollOffDateValid(rollOffDate, rollOnDate) {
//         if (!rollOffDate || !rollOnDate) return true; // Skip validation if either date is missing

//         const rollOff = new Date(rollOffDate);
//         const rollOn = new Date(rollOnDate);

//         return rollOff > rollOn;
//     }

//     // ==================== BEFORE CREATE HANDLER ====================

//     this.before('CREATE', EmployeeHeader, async (req) => {
//         const data = req.data;

//         // Set defaults for new records
//         data.ktStarted = true;
//         data.isNewRecord = true;
//         data.RollOnDate = data.RollOnDate || getTodayDate();
//         data.Staff_RollOffStatus = data.Staff_RollOffStatus ?? false;
//         data.handoverKtBegun = data.handoverKtBegun ?? false;

//         console.log(`[CREATE] New employee - ktStarted: ${data.ktStarted}, isNewRecord: ${data.isNewRecord}, RollOnDate: ${data.RollOnDate}`);
//     });

//     // ==================== BEFORE SAVE HANDLER ====================

//     this.before('SAVE', EmployeeHeader, async (req) => {
//         const data = req.data;

//         // After first save, mark as not new
//         if (data.isNewRecord === true) {
//             data.isNewRecord = false;
//         }

//         // Validation: RollOffDate must be greater than RollOnDate
//         if (!isRollOffDateValid(data.RollOffDate, data.RollOnDate)) {
//             req.error(400, 'Roll-Off Date must be greater than Roll-On Date', 'RollOffDate');
//         }
//     });

//     // ==================== AFTER READ HANDLER ====================

//     this.after('READ', EmployeeHeader, async (data, req) => {
//         const records = Array.isArray(data) ? data : [data];

//         for (const record of records) {
//             if (!record || !record.ID) continue;

//             // Check 3-month condition for existing records
//             if (record.isNewRecord === false && record.RollOnDate && isOlderThanThreeMonths(record.RollOnDate)) {
//                 // Hide ktStarted field
//                 record.isKtStartedHidden = true;

//                 // Update ktStarted to false if still true
//                 if (record.ktStarted === true) {
//                     try {
//                         await UPDATE(EmployeeHeader)
//                             .set({ ktStarted: false })
//                             .where({ ID: record.ID });

//                         record.ktStarted = false;
//                         console.log(`[READ] Updated ktStarted to false for ID: ${record.ID}`);
//                     } catch (error) {
//                         console.error(`[READ] Error updating ktStarted:`, error);
//                     }
//                 }
//             } else {
//                 record.isKtStartedHidden = false;
//             }

//             console.log(`[READ] ID: ${record.ID}, isNewRecord: ${record.isNewRecord}, ktStarted: ${record.ktStarted}, isKtStartedHidden: ${record.isKtStartedHidden}`);
//         }
//     });

//     // ==================== AFTER NEW (DRAFT) HANDLER ====================

//     this.on('NEW', EmployeeHeader.drafts, async (req, next) => {
//         const data = await next();

//         // Set defaults for new draft
//         data.ktStarted = true;
//         data.isNewRecord = true;
//         data.RollOnDate = getTodayDate();
//         data.Staff_RollOffStatus = false;
//         data.handoverKtBegun = false;
//         data.isKtStartedHidden = false;

//         console.log(`[NEW DRAFT] Initialized - isNewRecord: ${data.isNewRecord}, ktStarted: ${data.ktStarted}, RollOnDate: ${data.RollOnDate}`);

//         return data;
//     });

//     // ==================== AFTER EDIT (DRAFT) HANDLER ====================

//     this.after('EDIT', EmployeeHeader, async (data, req) => {
//         if (!data) return;

//         // Existing record being edited - isNewRecord should already be false
//         if (isOlderThanThreeMonths(data.RollOnDate)) {
//             data.isKtStartedHidden = true;
//         } else {
//             data.isKtStartedHidden = false;
//         }

//         console.log(`[EDIT] ID: ${data.ID}, isNewRecord: ${data.isNewRecord}, ktStarted: ${data.ktStarted}`);
//     });

//     // ==================== BEFORE PATCH (DRAFT) HANDLER - VALIDATION ====================

//     this.before('PATCH', EmployeeHeader.drafts, async (req) => {
//         const data = req.data;

//         // Only validate if RollOffDate is being changed
//         if ('RollOffDate' in data) {
//             // Get the current draft record to check RollOnDate
//             const draftRecord = await SELECT.one.from(EmployeeHeader.drafts).where({ ID: req.data.ID });

//             if (draftRecord) {
//                 const rollOnDate = data.RollOnDate || draftRecord.RollOnDate;
//                 const rollOffDate = data.RollOffDate;

//                 // Validate RollOffDate
//                 if (!isRollOffDateValid(rollOffDate, rollOnDate)) {
//                     req.error(400, 'Roll-Off Date must be greater than Roll-On Date', 'RollOffDate');
//                 }
//             }

//             console.log(`[PATCH DRAFT] RollOffDate validation - RollOffDate: ${data.RollOffDate}`);
//         }

//         // Also validate if RollOnDate is being changed and RollOffDate already exists
//         if ('RollOnDate' in data) {
//             const draftRecord = await SELECT.one.from(EmployeeHeader.drafts).where({ ID: req.data.ID });

//             if (draftRecord && draftRecord.RollOffDate) {
//                 const rollOnDate = data.RollOnDate;
//                 const rollOffDate = data.RollOffDate || draftRecord.RollOffDate;

//                 if (!isRollOffDateValid(rollOffDate, rollOnDate)) {
//                     req.error(400, 'Roll-Off Date must be greater than Roll-On Date', 'RollOffDate');
//                 }
//             }

//             console.log(`[PATCH DRAFT] RollOnDate validation - RollOnDate: ${data.RollOnDate}`);
//         }
//     });

//     // ==================== AFTER PATCH (DRAFT) HANDLER ====================

//     this.after('PATCH', EmployeeHeader.drafts, async (data, req) => {
//         if (!data) return;

//         // If ktStarted was changed, log for debugging
//         if ('ktStarted' in req.data) {
//             console.log(`[PATCH DRAFT] ktStarted changed to: ${data.ktStarted}`);
//         }
//     });

// });

const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { EmployeeHeader } = this.entities;

    // ==================== CONSTANTS ====================

    const FieldControl = {
        HIDDEN: 0,
        READONLY: 1,
        OPTIONAL: 3,
        MANDATORY: 7
    };

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Check if the record is older than 3 months from RollOnDate
     */
    function isOlderThanThreeMonths(rollOnDate) {
        if (!rollOnDate) return false;

        const rollOn = new Date(rollOnDate);
        const today = new Date();

        const monthsDiff = (today.getFullYear() - rollOn.getFullYear()) * 12
            + (today.getMonth() - rollOn.getMonth());

        return monthsDiff >= 3;
    }

    /**
     * Get today's date in ISO format (YYYY-MM-DD)
     */
    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Validate RollOffDate against RollOnDate
     */
    function isRollOffDateValid(rollOffDate, rollOnDate) {
        if (!rollOffDate || !rollOnDate) return true;

        const rollOff = new Date(rollOffDate);
        const rollOn = new Date(rollOnDate);

        return rollOff > rollOn;
    }

    // ==================== BEFORE NEW (DRAFT) HANDLER ====================
    // Use 'before' instead of 'on' to avoid UPDATE issues

    this.before('NEW', EmployeeHeader.drafts, async (req) => {
        // Set defaults for new draft - these will be applied during draft creation
        req.data.ktStarted = true;
        req.data.isNewRecord = true;
        req.data.RollOnDate = getTodayDate();
        req.data.Staff_RollOffStatus = false;
        req.data.handoverKtBegun = false;

        console.log(`[BEFORE NEW DRAFT] Setting defaults - RollOnDate: ${req.data.RollOnDate}, ktStarted: ${req.data.ktStarted}`);
    });

    // ==================== BEFORE CREATE HANDLER ====================

    this.before('CREATE', EmployeeHeader, async (req) => {
        const data = req.data;

        // Ensure defaults for new records
        data.ktStarted = true;
        data.isNewRecord = true;
        data.RollOnDate = data.RollOnDate || getTodayDate();
        data.Staff_RollOffStatus = data.Staff_RollOffStatus ?? false;
        data.handoverKtBegun = data.handoverKtBegun ?? false;

        console.log(`[CREATE] New employee - ktStarted: ${data.ktStarted}, isNewRecord: ${data.isNewRecord}, RollOnDate: ${data.RollOnDate}`);
    });

    // ==================== BEFORE SAVE HANDLER ====================

    this.before('SAVE', EmployeeHeader, async (req) => {
        const data = req.data;

        // After first save, mark as not new
        if (data.isNewRecord === true) {
            data.isNewRecord = false;
        }

        // Validation: RollOffDate must be greater than RollOnDate
        if (!isRollOffDateValid(data.RollOffDate, data.RollOnDate)) {
            req.error(400, 'Roll-Off Date must be greater than Roll-On Date', 'RollOffDate');
        }
    });

    // ==================== AFTER READ HANDLER ====================

    this.after('READ', EmployeeHeader, async (data, req) => {
        const records = Array.isArray(data) ? data : [data];

        for (const record of records) {
            if (!record || !record.ID) continue;

            // Check 3-month condition for existing records
            if (record.isNewRecord === false && record.RollOnDate && isOlderThanThreeMonths(record.RollOnDate)) {
                // Hide ktStarted field
                record.isKtStartedHidden = true;

                // Update ktStarted to false if still true
                if (record.ktStarted === true) {
                    try {
                        await UPDATE(EmployeeHeader)
                            .set({ ktStarted: false })
                            .where({ ID: record.ID });

                        record.ktStarted = false;
                        console.log(`[READ] Updated ktStarted to false for ID: ${record.ID}`);
                    } catch (error) {
                        console.error(`[READ] Error updating ktStarted:`, error);
                    }
                }
            } else {
                record.isKtStartedHidden = false;
            }
        }
    });

    // ==================== AFTER EDIT (DRAFT) HANDLER ====================

    this.after('EDIT', EmployeeHeader, async (data, req) => {
        if (!data) return;

        // Existing record being edited
        if (isOlderThanThreeMonths(data.RollOnDate)) {
            data.isKtStartedHidden = true;
        } else {
            data.isKtStartedHidden = false;
        }

        console.log(`[EDIT] ID: ${data.ID}, isNewRecord: ${data.isNewRecord}, ktStarted: ${data.ktStarted}`);
    });

    // ==================== BEFORE PATCH (DRAFT) HANDLER - VALIDATION ====================

    this.before('PATCH', EmployeeHeader.drafts, async (req) => {
        const data = req.data;

        // Only validate if RollOffDate is being changed
        if ('RollOffDate' in data && data.RollOffDate) {
            const draftRecord = await SELECT.one.from(EmployeeHeader.drafts).where({ ID: req.data.ID });

            if (draftRecord) {
                const rollOnDate = data.RollOnDate || draftRecord.RollOnDate;
                const rollOffDate = data.RollOffDate;

                if (!isRollOffDateValid(rollOffDate, rollOnDate)) {
                    req.error(400, 'Roll-Off Date must be greater than Roll-On Date', 'RollOffDate');
                }
            }

            console.log(`[PATCH DRAFT] RollOffDate validation - RollOffDate: ${data.RollOffDate}`);
        }

        // Also validate if RollOnDate is being changed and RollOffDate already exists
        if ('RollOnDate' in data && data.RollOnDate) {
            const draftRecord = await SELECT.one.from(EmployeeHeader.drafts).where({ ID: req.data.ID });

            if (draftRecord && draftRecord.RollOffDate) {
                const rollOnDate = data.RollOnDate;
                const rollOffDate = data.RollOffDate || draftRecord.RollOffDate;

                if (!isRollOffDateValid(rollOffDate, rollOnDate)) {
                    req.error(400, 'Roll-Off Date must be greater than Roll-On Date', 'RollOffDate');
                }
            }

            console.log(`[PATCH DRAFT] RollOnDate validation - RollOnDate: ${data.RollOnDate}`);
        }
    });

    // ==================== AFTER PATCH (DRAFT) HANDLER ====================

    this.after('PATCH', EmployeeHeader.drafts, async (data, req) => {
        if (!data) return;

        if ('ktStarted' in req.data) {
            console.log(`[PATCH DRAFT] ktStarted changed to: ${data.ktStarted}`);
        }
    });

});