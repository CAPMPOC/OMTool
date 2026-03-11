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

    /**
     * Calculate months elapsed since RollOnDate
     * Returns 0 if RollOnDate is in the future or not set
     */
    function calculateMonthsElapsed(rollOnDate) {
        if (!rollOnDate) return 0;

        const rollOn = new Date(rollOnDate);
        const today = new Date();

        // If RollOnDate is in the future, return 0
        if (rollOn > today) return 0;

        const monthsDiff = (today.getFullYear() - rollOn.getFullYear()) * 12
            + (today.getMonth() - rollOn.getMonth());

        // Ensure non-negative value
        return Math.max(0, monthsDiff);
    }

    /**
     * Calculate experience fields for a record
     * - SAP (displayed) = stored SAP + monthsElapsed
     * - SAPToday = NonSAP + SAP (displayed)
     */
    function calculateExperienceFields(record) {
        const storedNonSAP = record.NonSAP || 0;
        const storedSAP = record.SAP || 0;
        const monthsElapsed = calculateMonthsElapsed(record.RollOnDate);

        // Calculate displayed SAP (original + months since onboarding)
        const calculatedSAP = storedSAP + monthsElapsed;

        // Calculate total experience
        const calculatedSAPToday = storedNonSAP + calculatedSAP;

        return {
            storedSAP: storedSAP,
            displayedSAP: calculatedSAP,
            SAPToday: calculatedSAPToday,
            monthsElapsed: monthsElapsed
        };
    }

    /**
     * Check if RollOffDate is filled (not null, undefined, or empty string)
     */
    function isRollOffDateFilled(rollOffDate) {
        return rollOffDate !== null && rollOffDate !== undefined && rollOffDate !== '';
    }

    // ==================== BEFORE NEW (DRAFT) HANDLER ====================
    // Use 'before' instead of 'on' to avoid UPDATE issues

    this.before('NEW', EmployeeHeader.drafts, async (req) => {
        // Set defaults ONLY if values are not provided
        req.data.ktStarted = req.data.ktStarted ?? true;
        req.data.isNewRecord = req.data.isNewRecord ?? true;
        req.data.RollOnDate = req.data.RollOnDate || getTodayDate();
        req.data.Staff_RollOffStatus = req.data.Staff_RollOffStatus ?? false;
        req.data.handoverKtBegun = req.data.handoverKtBegun ?? false;

        // ✅ ONLY set to 0 if not provided or null/undefined
        req.data.NonSAP = req.data.NonSAP ?? 0;
        req.data.SAP = req.data.SAP ?? 0;

        console.log(`[BEFORE NEW DRAFT] Setting defaults - RollOnDate: ${req.data.RollOnDate}, ktStarted: ${req.data.ktStarted}, NonSAP: ${req.data.NonSAP}, SAP: ${req.data.SAP}`);
    });

    // ==================== BEFORE CREATE HANDLER ====================

    this.before('CREATE', EmployeeHeader, async (req) => {
        const data = req.data;

        // Ensure defaults for new records - DON'T OVERWRITE existing values
        data.ktStarted = data.ktStarted ?? true;
        data.isNewRecord = data.isNewRecord ?? true;
        data.RollOnDate = data.RollOnDate || getTodayDate();
        data.Staff_RollOffStatus = data.Staff_RollOffStatus ?? false;
        data.handoverKtBegun = data.handoverKtBegun ?? false;

        // ✅ Only default to 0 if not provided
        data.NonSAP = data.NonSAP ?? 0;
        data.SAP = data.SAP ?? 0;

        console.log(`[CREATE] New employee - NonSAP: ${data.NonSAP}, SAP: ${data.SAP}, ktStarted: ${data.ktStarted}, isNewRecord: ${data.isNewRecord}, RollOnDate: ${data.RollOnDate}`);
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

        // Validation: Mandatory fields when RollOffDate is filled
        if (isRollOffDateFilled(data.RollOffDate)) {
            if (!data.Staff_RollOffStatus) {
                req.error(400, 'Employee Roll-off Status is required when Roll-Off Date is filled', 'Staff_RollOffStatus');
            }
            if (!data.Staff_RollOffReasons) {
                req.error(400, 'Employee Roll-off Reason is required when Roll-Off Date is filled', 'Staff_RollOffReasons');
            }
            if (!data.Staff_ReasonsRemarks) {
                req.error(400, 'Reasons/Remarks is required when Roll-Off Date is filled', 'Staff_ReasonsRemarks');
            }
            if (!data.RollOffImpact_ROI) {
                req.error(400, 'Impact of Roll Off is required when Roll-Off Date is filled', 'RollOffImpact_ROI');
            }
            if (!data.handoverKtBegun) {
                req.error(400, 'Handover KT is required when Roll-Off Date is filled', 'handoverKtBegun');
            }
        }
    });

    // ==================== AFTER READ HANDLER ====================

    this.after('READ', EmployeeHeader, async (data, req) => {
        const records = Array.isArray(data) ? data : [data];

        for (const record of records) {
            if (!record || !record.ID) continue;

            // Set isRollOffDateFilled virtual field
            record.isRollOffDateFilled = isRollOffDateFilled(record.RollOffDate);

            // Calculate experience fields for saved records
            if (record.isNewRecord === false) {
                const experience = calculateExperienceFields(record);

                // Override SAP with calculated value for display
                record.SAP = experience.displayedSAP;

                // Set virtual SAPToday field
                record.SAPToday = experience.SAPToday;

                console.log(`[READ] ID: ${record.ID}, Stored SAP: ${experience.storedSAP}, Displayed SAP: ${record.SAP}, SAPToday: ${record.SAPToday}, MonthsElapsed: ${experience.monthsElapsed}`);
            } else {
                // For new records, just calculate SAPToday without adding monthsElapsed
                const storedNonSAP = record.NonSAP || 0;
                const storedSAP = record.SAP || 0;
                record.SAPToday = storedNonSAP + storedSAP;

                console.log(`[READ - New Record] NonSAP: ${storedNonSAP}, SAP: ${storedSAP}, SAPToday: ${record.SAPToday}`);
            }

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

    // ==================== AFTER READ (DRAFTS) HANDLER ====================

    this.after('READ', EmployeeHeader.drafts, async (data, req) => {
        const records = Array.isArray(data) ? data : [data];

        for (const record of records) {
            if (!record) continue;

            // Set isRollOffDateFilled virtual field
            record.isRollOffDateFilled = isRollOffDateFilled(record.RollOffDate);

            // For new records (drafts), show entered values and calculate SAPToday
            if (record.isNewRecord === true) {
                const storedNonSAP = record.NonSAP || 0;
                const storedSAP = record.SAP || 0;
                record.SAPToday = storedNonSAP + storedSAP;

                console.log(`[READ DRAFT - New] NonSAP: ${storedNonSAP}, SAP: ${storedSAP}, SAPToday: ${record.SAPToday}`);
            } else {
                // For existing records being edited, show calculated values
                const experience = calculateExperienceFields(record);
                record.SAP = experience.displayedSAP;
                record.SAPToday = experience.SAPToday;

                console.log(`[READ DRAFT - Edit] Stored SAP: ${experience.storedSAP}, Displayed SAP: ${record.SAP}, SAPToday: ${record.SAPToday}`);
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

        // Set isRollOffDateFilled
        data.isRollOffDateFilled = isRollOffDateFilled(data.RollOffDate);

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

        // Log when experience fields are updated
        if ('NonSAP' in req.data || 'SAP' in req.data) {
            console.log(`[PATCH DRAFT] Experience updated - NonSAP: ${data.NonSAP}, SAP: ${data.SAP}`);
        }

        // Update isRollOffDateFilled when RollOffDate changes
        if ('RollOffDate' in req.data) {
            const filled = isRollOffDateFilled(data.RollOffDate);
            data.isRollOffDateFilled = filled;
            console.log(`[PATCH DRAFT] RollOffDate changed, isRollOffDateFilled: ${filled}`);
        }
    });
    // ==================== AFTER CREATE HANDLER - SBPA ALERT ====================
    // For Production
    // this.after('CREATE', EmployeeHeader, async (data, req) => {
    //     // Only trigger for actual CREATE (not drafts)
    //     if (!data || !data.ID) {
    //         console.log('[SBPA ALERT] No data returned from CREATE, skipping alert');
    //         return;
    //     }

    //     console.log(`[SBPA ALERT] New employee created - ID: ${data.ID}, EmpID: ${data.Empid}`);

    //     try {
    //         // Your Definition ID from SBPA
    //         const DEFINITION_ID = 'us10.d09d1a89trial.employeeonboardingalert1.newEmployeeAdded';

    //         // Prepare payload matching your SBPA input parameters
    //         const alertPayload = {
    //             definitionId: DEFINITION_ID,
    //             context: {
    //                 Empid: data.Empid || '',
    //                 FirstName: data.FirstName || '',
    //                 LastName: data.LastName || '',
    //                 CID: data.CID || '',
    //                 Accessibility: data.Accessibility_AccessID || '',
    //                 Location: data.Location_LocID || '',
    //                 RollOnDate: data.RollOnDate ? data.RollOnDate.toString() : ''
    //             }
    //         };

    //         console.log('[SBPA ALERT] Payload:', JSON.stringify(alertPayload, null, 2));

    //         // Connect to SBPA destination and trigger workflow
    //         const sbpaService = await cds.connect.to('SBPA_API');

    //         const response = await sbpaService.send({
    //             method: 'POST',
    //             path: '/workflow-instances',
    //             data: alertPayload,
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         });

    //         console.log(`[SBPA ALERT] Workflow triggered successfully. Instance ID: ${response.id}`);

    //     } catch (error) {
    //         // Log error but don't fail the CREATE operation
    //         console.error('[SBPA ALERT] Failed to trigger SBPA workflow:', error.message);

    //         if (error.response) {
    //             console.error('[SBPA ALERT] Response status:', error.response.status);
    //             console.error('[SBPA ALERT] Response data:', JSON.stringify(error.response.data));
    //         }
    //     }
    // });
});