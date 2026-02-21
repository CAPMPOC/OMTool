const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {
    const { EmployeeHeader } = this.entities;

    // Common.FieldControlType (Edm.Byte)
    // 0 = Hidden, 1 = ReadOnly, 7 = Optional (editable)
    const FC = { Hidden: 0, ReadOnly: 1, Optional: 7 };

    const todayISO = () => new Date().toISOString().slice(0, 10);
    const parseDate = (iso) => (iso ? new Date(`${iso}T00:00:00.000Z`) : null);

    // Calendar month addition (JS handles month-end behavior)
    const addCalendarMonths = (iso, months) => {
        const d = parseDate(iso);
        if (!d) return null;

        const y = d.getUTCFullYear();
        const m = d.getUTCMonth();
        const day = d.getUTCDate();

        const tmp = new Date(Date.UTC(y, m, 1));
        tmp.setUTCMonth(tmp.getUTCMonth() + months);
        tmp.setUTCDate(day);
        return tmp;
    };

    const isOlderThan3Months = (rollOnISO) => {
        if (!rollOnISO) return false;
        const threshold = addCalendarMonths(rollOnISO, 3);
        const today = parseDate(todayISO());
        return threshold && today >= threshold;
    };

    // Normalize values for comparison (draft UI may send "" / null / etc.)
    const normalize = (v) => {
        if (v === undefined) return undefined;
        if (v === '') return null;
        return v;
    };

    const same = (a, b) => {
        a = normalize(a);
        b = normalize(b);
        if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
        return a === b;
    };

    // Apply UI field controls consistently
    const applyFieldControls = (data) => {
        const rows = Array.isArray(data) ? data : [data];

        for (const row of rows) {
            if (!row) continue;

            const older = isOlderThan3Months(row.RollOnDate);

            // ktStarted visible/editable before 3 months, hidden after 3 months
            row.ktStartedFC = older ? FC.Hidden : FC.Optional;

            // roll-off fields read-only while ktStarted=true, editable when ktStarted=false
            row.rollOffFC = row.ktStarted ? FC.ReadOnly : FC.Optional;

            // safety: if older, ensure UI shows unchecked
            if (older) row.ktStarted = false;
        }
    };

    // ---------------------------------------------------------------------------
    // 1) Persisted flip: ktStarted true -> false after 3 months (ACTIVE records)
    // ---------------------------------------------------------------------------
    this.before('READ', EmployeeHeader, async (req) => {
        const targetName = req.target?.name || '';
        if (targetName.endsWith('.drafts')) return; // don't persist changes on draft reads

        const cutoff = new Date();
        cutoff.setUTCMonth(cutoff.getUTCMonth() - 3);
        const cutoffISO = cutoff.toISOString().slice(0, 10);

        await UPDATE(EmployeeHeader)
            .set({ ktStarted: false })
            .where({ ktStarted: true, RollOnDate: { '<=': cutoffISO } });
    });

    // ---------------------------------------------------------------------------
    // 2) Defaults on CREATE (IMPORTANT: set FC values already here)
    // ---------------------------------------------------------------------------
    this.before('CREATE', EmployeeHeader, async (req) => {
        // Always true on create
        req.data.ktStarted = true;

        // Default RollOnDate to today
        if (!req.data.RollOnDate) req.data.RollOnDate = todayISO();

        // Clear roll-off fields on create
        req.data.Staff_RollOffStatus = req.data.Staff_RollOffStatus ?? false;
        req.data.Staff_RollOffReasons = null;
        req.data.Staff_ReasonsRemarks = null;
        req.data.handoverKtBegun = req.data.handoverKtBegun ?? false;
        req.data.RollOffDate = null;
        req.data.RollOffImpact_ROI = null;

        // 🔥 Ensure initial draft form is locked immediately
        // (UI might render before doing a READ)
        req.data.ktStartedFC = FC.Optional;   // allow changing ktStarted in edit scenarios later
        req.data.rollOffFC = FC.ReadOnly;    // lock roll-off fields during create
    });

    // ---------------------------------------------------------------------------
    // 3) UPDATE enforcement + validation (block only if protected fields CHANGED)
    // ---------------------------------------------------------------------------
    this.before('UPDATE', EmployeeHeader, async (req) => {
        const { ID } = req.data;
        if (!ID) return;

        const target = req.target; // active OR drafts
        const current = await SELECT.one.from(target).where({ ID });

        const hasActive =
            (req.data.HasActiveEntity !== undefined)
                ? req.data.HasActiveEntity
                : current?.HasActiveEntity;

        // New draft during CREATE flow (HasActiveEntity=false):
        // force ktStarted=true and strip protected fields (draft UI may send them)
        if (hasActive === false) {
            req.data.ktStarted = true;

            delete req.data.Staff_RollOffStatus;
            delete req.data.Staff_RollOffReasons;
            delete req.data.Staff_ReasonsRemarks;
            delete req.data.handoverKtBegun;
            delete req.data.RollOffDate;
            delete req.data.RollOffImpact_ROI;
            delete req.data.RollOffImpact;
        }

        const finalKtStarted =
            (req.data.ktStarted !== undefined) ? req.data.ktStarted : current?.ktStarted;

        const protectedFields = [
            'Staff_RollOffStatus',
            'Staff_RollOffReasons',
            'Staff_ReasonsRemarks',
            'handoverKtBegun',
            'RollOffDate',
            'RollOffImpact_ROI',
            'RollOffImpact'
        ];

        const changedProtected = protectedFields.filter((f) => {
            if (req.data[f] === undefined) return false;
            return !same(req.data[f], current?.[f]);
        });

        if (finalKtStarted === true && changedProtected.length) {
            return req.reject(
                400,
                `Roll-off fields cannot be edited while ktStarted = true. Attempted: ${changedProtected.join(', ')}`
            );
        }

        // Validate RollOffDate > RollOnDate
        const finalRollOn =
            (req.data.RollOnDate !== undefined) ? req.data.RollOnDate : current?.RollOnDate;
        const finalRollOff =
            (req.data.RollOffDate !== undefined) ? req.data.RollOffDate : current?.RollOffDate;

        if (finalRollOn && finalRollOff) {
            if (parseDate(finalRollOff) <= parseDate(finalRollOn)) {
                return req.reject(400, 'RollOffDate must be greater than RollOnDate.');
            }
        }
    });

    // ---------------------------------------------------------------------------
    // 4) Apply FieldControls on READ + CREATE + UPDATE (active + drafts)
    // ---------------------------------------------------------------------------
    this.after(['READ', 'CREATE', 'UPDATE'], EmployeeHeader, (data) => applyFieldControls(data));

    // Draft entity hooks (important for draft object page behavior)
    if (this.entities['EmployeeHeader.drafts']) {
        this.after(['READ', 'CREATE', 'UPDATE'], this.entities['EmployeeHeader.drafts'], (data) => applyFieldControls(data));
    }
});
