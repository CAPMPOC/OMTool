using empheader from '../db/master-employee';

service OMTSrv{
    @odata.draft.enabled
    entity EmployeeHeader as select from empheader.EmployeeHeader
}
