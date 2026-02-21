using empheader from '../db/master-employee';

service OMTSrv {
        @odata.draft.enabled
        entity EmployeeHeader  as select from empheader.EmployeeHeader;

        entity AccessibilityVH as projection on empheader.AccessibilityVH;
        entity LocationVH      as projection on empheader.LocationVH;
        entity RollOffImpactVH as projection on empheader.RollofImpactVH;
        entity SkillVH         as projection on empheader.SkillVH;
}

//Design level annotation
annotate OMTSrv.EmployeeHeader with @(UI: {
        SelectionFields       : [
                Accessibility_AccessID,
                Location_LocID
        ],
        HeaderInfo            : {
                $Type         : 'UI.HeaderInfoType',
                TypeName      : 'Employee',
                TypeNamePlural: 'Employees',
                Title         : {$value: {Empid}},
                Description   : {$value: {Empid}},
        },
        LineItem              : [
                {
                        $Type: 'UI.DataField',
                        Value: Empid,
                        Label: 'Employee ID',
                },
                {
                        $Type: 'UI.DataField',
                        Value: CID,
                        Label: 'C-User ID',
                },
                {
                        $Type: 'UI.DataField',
                        Value: FirstName,
                        Label: 'First Name',
                },
                {
                        $Type: 'UI.DataField',
                        Value: LastName,
                        Label: 'Last Name',
                },
                {
                        $Type: 'UI.DataField',
                        Value: Employer,
                        Label: 'Employer Name'
                },
                {
                        $Type: 'UI.DataField',
                        Value: Accessibility_AccessID,
                        Label: 'Position',
                },
                {
                        $Type: 'UI.DataField',
                        Value: Location_LocID,
                        Label: 'Employee Location',
                },
                {
                        $Type: 'UI.DataField',
                        Value: ProductGroup,
                        Label: 'Product Group',
                },
                {
                        $Type: 'UI.DataField',
                        Value: Product,
                        Label: 'Product',
                },
                {
                        $Type: 'UI.DataField',
                        Value: ServiceGroup,
                        Label: 'Service Group',
                },
                {
                        $Type: 'UI.DataField',
                        Value: NonSAP,
                        Label: 'Non-SAP Experience',
                },
                {
                        $Type: 'UI.DataField',
                        Value: SAP,
                        Label: 'SAP Experience',
                },
                {
                        $Type: 'UI.DataField',
                        Value: SAPToday,
                        Label: 'Total Experience',
                },
        ],
        //Facets
        FieldGroup #BasicInfo : {
                $Type: 'UI.FieldGroupType',
                Data : [
                        {
                                $Type: 'UI.DataField',
                                Value: Empid,
                                Label: 'Employee ID'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: FirstName,
                                Label: 'First Name'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: LastName,
                                Label: 'Last Name'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: CID,
                                Label: 'C-User ID'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Location_LocID,
                                Label: 'Employee Location'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: ktStarted,
                                // Common.FieldControl: {$Path: 'ktStartedFC'},
                                Label: 'Has on-boarding KT begun'
                        },
                ]
        },

        FieldGroup #Assignment: {
                $Type: 'UI.FieldGroupType',
                Data : [
                        {
                                $Type: 'UI.DataField',
                                Value: Employer,
                                Label: 'Employer Name'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: ServiceGroup,
                                Label: 'Service Group'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: ProductGroup,
                                Label: 'Product Group'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Product,
                                Label: 'Product'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Accessibility_AccessID,
                                Label: 'Position'
                        }
                ]
        },

        FieldGroup #Experience: {
                $Type: 'UI.FieldGroupType',
                Data : [
                        {
                                $Type: 'UI.DataField',
                                Value: NonSAP,
                                Label: 'Non-SAP Experience'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: SAP,
                                Label: 'SAP Experience'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: SAPToday,
                                Label: 'Total Experience'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Skill_SkillID,
                                Label: 'Employee Skills'
                        }
                ]
        },

        FieldGroup #RollOff   : {
                $Type: 'UI.FieldGroupType',
                Data : [
                        {
                                $Type: 'UI.DataField',
                                Value: handoverKtBegun,
                                // Common.FieldControl: {$Path: 'ktStartedFC'},
                                Label: 'Has Handover KT begun?'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Staff_RollOffStatus,
                                // Common.FieldControl: {$Path: 'rollOffFC'},
                                Label: 'Employee Roll-off Status'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Staff_RollOffReasons,
                                // Common.FieldControl: {$Path: 'rollOffFC'},
                                Label: 'Employee Roll-off Reason'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Staff_ReasonsRemarks,
                                // Common.FieldControl: {$Path: 'rollOffFC'},
                                Label: 'Reasons/Remarks'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: RollOnDate,
                                Label: 'Roll-on Date'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: RollOffDate,
                                // @Common.FieldControl: {$Path: 'rollOffFC'},
                                Label: 'Roll-Off Date'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: RollOffImpact_ROI,
                                // Common.FieldControl: {$Path: 'rollOffFC'},
                                Label: 'Impact of Roll Off'
                        }
                ]
        },
        Facets                : [
                {
                        $Type : 'UI.ReferenceFacet',
                        Label : 'Basic Information',
                        Target: '@UI.FieldGroup#BasicInfo'
                },
                {
                        $Type : 'UI.ReferenceFacet',
                        Label : 'Assignment',
                        Target: '@UI.FieldGroup#Assignment'
                },
                {
                        $Type : 'UI.ReferenceFacet',
                        Label : 'Experience',
                        Target: '@UI.FieldGroup#Experience'
                },
                {
                        $Type : 'UI.ReferenceFacet',
                        Label : 'Roll-Off Details',
                        Target: '@UI.FieldGroup#RollOff'
                }
        ],
}, ) {
        // Keep your existing LineItem or adjust labels here
        Empid                @mandatory;
        CID                  @mandatory;
        FirstName            @mandatory;
        LastName             @mandatory;
        RollOffDate          @(
                Common.Label       : 'Roll-Off Date',
                Common.FieldControl: 'rollOffFC'
        );
        // Association field control (for value help field)
        RollOffImpact        @(
                Common.Label       : 'Impact of Roll Off',
                Common.FieldControl: 'rollOffFC'
        );
        // // Optional safety: in case UI binds to the generated FK field
        // RollOffImpact_ROI    @(Common.FieldControl: {$Path: 'rollOffFC'});
        RollOnDate           @Common.Label: 'Roll-on Date';
        Skill                @Common.Label: 'Employee Skills';
        // Roll-off related fields are read-only while ktStarted=true (computed by srv handler)
        Staff_ReasonsRemarks @(
                Common.Label       : 'Reasons/Remarks',
                Common.FieldControl: 'rollOffFC'
        );
        Staff_RollOffReasons @(
                Common.Label       : 'Employee Roll-off Reason',
                Common.FieldControl: 'rollOffFC'
        );
        Staff_RollOffStatus  @(
                Common.Label       : 'Employee Roll-off Status',
                Common.FieldControl: 'rollOffFC'
        );
        handoverKtBegun      @(
                Common.Label       : 'Has Handover KT begun?',
                Common.FieldControl: 'rollOffFC'
        );
        // Hide ktStarted after 3 months, editable otherwise (computed by srv handler)
        ktStarted            @(
                Common.Label       : 'Has on-boarding KT begun?',
                Common.FieldControl: 'ktStartedFC'
        );
        ID                   @(
                UI.Hidden          : true,
                Common.FieldControl: #Hidden,
                Common.Label       : 'GUID'
        );
};

// Hide helper fields from UI
annotate OMTSrv.EmployeeHeader with {
        ktStartedFC @UI.Hidden: true;
        rollOffFC   @UI.Hidden: true;
};


//Value Help mapping Annotation
annotate OMTSrv.EmployeeHeader with {
        Accessibility @(
                Common.ValueListWithFixedValues: true,
                Common.Text                    : Accessibility.Description,
                Common.Text.@UI.TextArrangement: #TextOnly,
                Common.Label                   : 'Position',
                Common.ValueList               : {
                        $Type         : 'Common.ValueListType',
                        CollectionPath: 'AccessibilityVH',
                        Parameters    : [{
                                $Type            : 'Common.ValueListParameterInOut',
                                LocalDataProperty: Accessibility_AccessID,
                                ValueListProperty: 'AccessID',
                        }],
                },
        );
        Location      @(
                Common.ValueListWithFixedValues: false,
                Common.Text                    : Location.LocDesc,
                Common.Text.@UI.TextArrangement: #TextOnly,
                Common.Label                   : 'Employee Location',
                Common.ValueList               : {
                        $Type         : 'Common.ValueListType',
                        CollectionPath: 'LocationVH',
                        Parameters    : [
                                {
                                        $Type            : 'Common.ValueListParameterInOut',
                                        LocalDataProperty: Location_LocID,
                                        ValueListProperty: 'LocID',
                                },
                                {
                                        $Type            : 'Common.ValueListParameterDisplayOnly',
                                        ValueListProperty: 'LocDesc',
                                }
                        ],
                },
        );
        RollOffImpact @(
                Common.ValueListWithFixedValues: true,
                Common.ValueList               : {
                        $Type         : 'Common.ValueListType',
                        CollectionPath: 'RollOffImpactVH',
                        Parameters    : [{
                                $Type            : 'Common.ValueListParameterInOut',
                                LocalDataProperty: RollOffImpact_ROI,
                                ValueListProperty: 'ROI',
                        }],
                },
        )
};

//Value Help Entity Annotation
annotate OMTSrv.AccessibilityVH with {
        AccessID @(
                Common.Text                    : Description,
                Common.Text.@UI.TextArrangement: #TextOnly
        )
}

annotate OMTSrv.LocationVH with {
        LocID @(Common.Text: LocDesc)
}
