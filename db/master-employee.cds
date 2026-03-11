namespace empheader;

using {cuid} from '@sap/cds/common';

entity EmployeeHeader : cuid {
            Empid                : String(20) not null;
            FirstName            : String(100);
            LastName             : String(100);
            Employer             : String(50);
            CID                  : String(30);
            ServiceGroup         : String(100);
            ProductGroup         : String(100);
            Product              : String(100);
            Location             : Association to LocationVH;
            RollOnDate           : Date;
            Staff_RollOffStatus  : Boolean default false;
            RollOffDate          : Date;
            Accessibility        : Association to AccessibilityVH;
            NonSAP               : Integer default 0;
            SAP                  : Integer default 0;
    virtual SAPToday             : Integer;
            RollOffImpact        : Association to RollofImpactVH;
            Skill                : Association to SkillVH;
            Staff_RollOffReasons : String(100);
            Staff_ReasonsRemarks : String(50);
            handoverKtBegun      : Boolean default false;
            ktStarted            : Boolean default true;

            // Persisted field to track new records (will be set to false after first save)
            isNewRecord          : Boolean default true;

            // Virtual fields for UI control (not persisted)
    virtual isKtStartedHidden    : Boolean default false;
    virtual rollOffFieldControl  : Integer default 1; // 1 = ReadOnly, 3 = Optional
    virtual rollOnFieldControl   : Integer default 1; // 1 = ReadOnly, 3 = Optional
    virtual isRollOffDateFilled  : Boolean default false;

}

entity AccessibilityVH {
    key AccessID    : String(10) @Common.Label: 'Accessbility ID';
        Description : String(30) @Common.Label: 'Description';
}

entity LocationVH {
    key LocID   : String(20)  @Common.Label: 'Location ID';
        LocDesc : String(100) @Common.Label: 'Location';
}

entity RollofImpactVH {
    key ROI : String(50) @Common.Label: 'Roll-Off Impact'
}

entity SkillVH {
    key SkillID : String(200) @Common.Label: 'Skill'
}
