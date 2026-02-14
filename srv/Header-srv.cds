using empheader from '../db/master-employee';

service OMTSrv{
    entity EmployeeHeader as select from empheader.EmployeeHeader
}
