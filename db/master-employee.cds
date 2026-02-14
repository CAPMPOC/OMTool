namespace empheader;

entity EmployeeHeader {
    key Empid                : String(20);
        FirstName            : String(100);
        LastName             : String(100);
        Employer             : String(50);
        CID                  : String(30);
        ServiceGroup         : String(70);
        ProductGroup         : String(100);
        Product              : String(100);
        Location             : String(100);
        RollOnDate           : Date;
        Staff_RollOffStatus  : Boolean default false;
        RollOffDate          : Date;
        Accessibility        : String(20);
        NonSAP               : String(10);
        SAP                  : String(10);
        SAPToday             : String(10);
        RollOffImpact        : String(50);
        Skill                : String(200);
        Staff_RollOffReasons : String(50);
        Staff_ReasonsRemarks : String(50);
}
