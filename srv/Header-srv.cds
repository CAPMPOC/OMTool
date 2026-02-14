using empheader from '../db/master-employee';

service OMTService {
    @odata.draft.enabled
    entity Employees as select from empheader.EmployeeHeader
}
