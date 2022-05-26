namespace my.Test;

entity AssessmentRequests {
    key ID            : Integer;
        supplieremail : String;
}

entity Approvers {
    key ID            : Integer;
    key UserID        : String;
    key approveremail : String;
}

entity Users {
    key firstname : String;
    key lastname  : String;
    key email     : String;
}

entity FirstWorkflow {
    key project_ID  : Integer;
        workflow_ID : String;
}

entity ResponseDetails {
    key ProjectID : Integer;
        name      : String;
}

entity ApprovalGroupParticipants {
    key UserID   : String(100);
        UserMail : String(100);
}

entity ApproverDetails {
    key ProjectID : Integer;
    key UserID    : String(50);
}

entity Test1 {
    key ID   : String;
    key name : String;
}


entity TestDepartmentMasterTable {
    key DepartmentID     : String(50)
            @Core.Computed;
        Description      : String(510) not null;
        ParentDepartment : String(50);
}

entity Testing {
    key name : String(5);
    date : Date;
}

entity SupplierMasterData {
    key vendorID           : String(40);
    key supplierName       : String(240);
    supplierLocation       : String(240);
    address                : String;
    criticalSupplier       : String(3);
    key category           : String(25);
    dateAdded              : Date;
    key contactName        : String(30);
    key phone              : Integer64;
    key email              : String;
    certifications         : String;
    energyIntensityRatio   : String;
}