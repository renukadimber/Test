using my.Test as my from '../db/data-model';

service CatalogService {
    entity AssessmentRequests        as projection on my.AssessmentRequests;
    entity Approvers                 as projection on my.Approvers;
    entity Users                     as projection on my.Users;
    entity ResponseDetails           as projection on my.ResponseDetails;
    entity ApprovalGroupParticipants as projection on my.ApprovalGroupParticipants;
    entity ApproverDetails           as projection on my.ApproverDetails;
    entity TestDepartmentMasterTable as projection on my.TestDepartmentMasterTable;
    entity Testing as projection on my.Testing;
    entity SupplierMasterData as projection on my.SupplierMasterData;
}
