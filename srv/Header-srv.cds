using empheader from '../db/master-employee';

service OMTSrv {
        @odata.draft.enabled
        entity EmployeeHeader  as select from empheader.EmployeeHeader;

        entity AccessibilityVH as projection on empheader.AccessibilityVH;
        entity LocationVH      as projection on empheader.LocationVH;
}

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
        Identification        : [

        ],
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
                                Value: Skill,
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
                                Label: 'Has Handover KT begun?'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Staff_RollOffStatus,
                                Label: 'Employee Roll-off Status'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Staff_RollOffReasons,
                                Label: 'Employee Roll-off Reason'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: Staff_ReasonsRemarks,
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
                                Label: 'Roll-Off Date'
                        },
                        {
                                $Type: 'UI.DataField',
                                Value: RollOffImpact,
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
        RollOffDate          @Common.Label: 'Roll-Off Date';
        RollOffImpact        @Common.Label: 'Impact of Roll Off';
        RollOnDate           @Common.Label: 'Roll-on Date';
        Skill                @Common.Label: 'Employee Skills';
        Staff_ReasonsRemarks @Common.Label: 'Reasons/Remarks';
        Staff_RollOffReasons @Common.Label: 'Employee Roll-off Reason';
        Staff_RollOffStatus  @Common.Label: 'Employee Roll-off Status';
        handoverKtBegun      @Common.Label: 'Has Handover KT begun?';
        ktStarted            @Common.Label: 'Has on-boarding KT begun?';
        ID                   @(
                UI.Hidden          : true,
                Common.FieldControl: #Hidden
        );
};

annotate OMTSrv.EmployeeHeader with {
        Accessibility @(
                Common.ValueListWithFixedValues: true,
                Common.Text                    : Accessibility.Description,
                Common.Text.@UI.TextArrangement: #TextOnly,
                Common.Label                   : 'Position',
                Common.ExternalID              : Accessibility.Description,
                Common.ValueList               : {
                        $Type         : 'Common.ValueListType',
                        CollectionPath: 'AccessibilityVH',
                        Parameters    : [{
                                $Type            : 'Common.ValueListParameterInOut',
                                LocalDataProperty: Accessibility_AccessID,
                                ValueListProperty: 'AccessID',
                        },
                        // {
                        //         $Type            : 'Common.ValueListParameterDisplayOnly',
                        //         LocalDataProperty: Accessibility_Description,
                        //         ValueListProperty: 'Description',
                        // },
                        ],
                },
        );
        Location      @(
                Common.ValueListWithFixedValues: false,
                Common.Text                    : Location.LocDesc,
                Common.Text.@UI.TextArrangement: #TextOnly,
                Common.Label                   : 'Employee Location',
                Common.ExternalID              : Location.LocDesc,
                Common.ValueList               : {
                        $Type         : 'Common.ValueListType',
                        CollectionPath: 'LocationVH',
                        Parameters    : [{
                                $Type            : 'Common.ValueListParameterInOut',
                                LocalDataProperty: Location_LocID,
                                ValueListProperty: 'LocID',
                        }
                        // {
                        //         $Type            : 'Common.ValueListParameterOut',
                        //         LocalDataProperty: Location_LocDesc,
                        //         ValueListProperty: 'LocDesc',
                        // }
                        ]
                }
        )
};
