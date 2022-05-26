//const axios = require("axios");
const request = require('request');
const cds = require('@sap/cds');
const { SELECT, INSERT } = cds.ql;
module.exports = (srv) => {
    
    srv.before("UPDATE", "TestDepartmentMasterTable", async req => {
        const { TestDepartmentMasterTable } = cds.entities('my.Test');
        const dept = await SELECT.columns`DepartmentID as Dept`.from(TestDepartmentMasterTable).where({ DepartmentID : req.data.ParentDepartment });
        if (dept.length != 0) {
            let URL = "(DepartmentID='" + req.data.DepartmentID + "')";
            console.log(URL,req.data.ParentDepartment);
            var insertDeptData = {
                method: 'PUT',
                url: 'https://supplierengagementsurvey-srv.cfapps.eu10.hana.ondemand.com/v2/catalog/DepartmentMasterTable' + URL,
                headers:
                {
                    'content-type': 'application/json'
                },
                body: {
                    "DepartmentID": req.data.DepartmentID,
                    "Description": req.data.Description,
                    "ParentDepartment": req.data.ParentDepartment
                },
                json: true

            };
            request(insertDeptData, function (error, response, body) {
                if (error) throw new Error(error)
            });
        }
        else {
            let errormsg = "ParentDepartment : " + req.data.ParentDepartment + " is not present in the system. Cannot insert DepartmentID : " + req.data.DepartmentID;
            req.reject(400, errormsg);
        }
    });

    const { Approvers, Users } = srv.entities
    async function getEmails(AssessmentRequests) {
        const result1 = await SELECT.one(AssessmentRequests).orderBy({ ID: 'desc' })
        let projectID = result1.ID

        const approver = await SELECT.columns`approveremail as SecondApprover`.from(Approvers).where({ ID: projectID })
        let supplier = result1.supplieremail

        const name = await SELECT.columns`firstname as firstName,lastname as lastName`.from(Users).where({ email: supplier })
        approver.unshift({ 'projectID': projectID });
        approver.unshift({ 'name': name });
        approver.unshift({ 'supplier': supplier });
        return result1 ? approver : 1
    }
    srv.after("CREATE", "AssessmentRequests", async req => {
        let SecondApprovers = await getEmails("CatalogService.AssessmentRequests");
        let fullname = SecondApprovers[1].name
        let suppliermail = SecondApprovers[0].supplier
        let projectID = SecondApprovers[2].projectID

        SecondApprovers.shift();
        SecondApprovers.shift();
        SecondApprovers.shift();
        let test = [{
            "definitionId": "myworkflow.myworkflow",
            "context": {
                "buyerData": {
                    "firstName": fullname[0].firstName,
                    "lastName": fullname[0].lastName,
                    "Requester_mail_id": suppliermail,//SecondApprovers[0].supplier,
                    "first_approver_mail_id": suppliermail,
                    "first_approver": suppliermail,//SecondApprovers[0].supplier,
                    "address": "Mumbai"
                },
                SecondApprovers
            }
        }]

        //First Scenario
        let token;
        var getToken = {
            method: 'POST',
            url: 'https://7dcdf1e5trial.authentication.us10.hana.ondemand.com/oauth/token?grant_type=client_credentials',
            headers:
            {
                authorization: 'Basic c2ItY2xvbmUtMWVlMDI0MjUtNzRjZi00ZTU5LWFhNzYtMTg5YWY2M2E2ZmI0IWIzOTA1NXx3b3JrZmxvdyFiMTc3NDpkOGIwM2VjMi04NWY4LTQyMDMtYmI1Mi1jMTk0Mzg3ZjVjMzckRUtDSWZQVXREWFZOeTMtVlNiUDFLWkx1RDdLUm9jZVZaNDNMRTZkTFptOD0='
            },
            body: {
            },
            json: true

        };
        request(getToken, function (error, response, body) {
            if (error) throw new Error(error)
            else {
                token = body.access_token
                let access_token = 'Bearer ' + token;
                var options = {
                    method: 'POST',
                    url: 'https://api.workflow-sap.cfapps.us10.hana.ondemand.com/workflow-service/rest/v1/workflow-instances',
                    headers:
                    {
                        'postman-token': 'c460ea7e-6f8f-69ab-fade-2bb9c53978c3',
                        'cache-control': 'no-cache',
                        authorization: access_token,
                        'content-type': 'application/json'
                    },
                    body: {
                        definitionId: 'myworkflow.myworkflow',
                        context:
                        {
                            buyerData:
                            {
                                firstName: fullname[0].firstName,
                                lastName: fullname[0].lastName,
                                Requester_mail_id: suppliermail,//SecondApprovers[0].supplier,
                                first_approver_mail_id: suppliermail,
                                first_approver: suppliermail,//SecondApprovers[0].supplier,
                                address: "Mumbai"
                            },
                            SecondApprovers
                        }
                    },
                    json: true
                };
                request(options, function (error, response, body) {
                    if (error) throw new Error(error)
                    else {
                        //const { FirstWorkflow } = cds.entities('my.Test');

                        //const data = [
                        //    { project_ID: projectID, workflow_ID: workflowID }
                        //]
                        //let query = cds.create(FirstWorkflow).entries(data);
                        //let result = cds.run(query)
                        //console.log(result);
                        var workflowID = body.id;
                        console.log(projectID, workflowID);
                        console.log("AssessmentRequest created, mail has been sent to responder")
                        //insert workflow id and project id in table
                        var insertData = {
                            method: 'POST',
                            url: 'https://supplierengagementsurvey-srv.cfapps.eu10.hana.ondemand.com/v2/catalog/Workflow',
                            headers:
                            {
                                'content-type': 'application/json'
                            },
                            body: {
                                "project_ID": projectID,
                                "workflow_ID": workflowID
                            },
                            json: true

                        };
                        request(insertData, function (error, response, body) {
                            if (error) throw new Error(error)
                            else {
                                console.log(body);
                            }
                        });
                    }
                });
            }
        });


    })

    //Second scenario
    srv.after("UPDATE", "ResponseDetails", async req => {
        const { FirstWorkflow } = cds.entities('my.Test');
        const workflow_ID = await SELECT.columns`workflow_ID as ID`.from(FirstWorkflow).where({ project_ID: req.ProjectID })
        let InstanceID = workflow_ID[0].ID;
        var url1 = 'https://api.workflow-sap.cfapps.us10.hana.ondemand.com/workflow-service/rest/v1/workflow-instances/' + InstanceID + '/execution-logs';


        let token1;
        //get token
        var getToken1 = {
            method: 'POST',
            url: 'https://7dcdf1e5trial.authentication.us10.hana.ondemand.com/oauth/token?grant_type=client_credentials',
            headers:
            {
                authorization: 'Basic c2ItY2xvbmUtMWVlMDI0MjUtNzRjZi00ZTU5LWFhNzYtMTg5YWY2M2E2ZmI0IWIzOTA1NXx3b3JrZmxvdyFiMTc3NDpkOGIwM2VjMi04NWY4LTQyMDMtYmI1Mi1jMTk0Mzg3ZjVjMzckRUtDSWZQVXREWFZOeTMtVlNiUDFLWkx1RDdLUm9jZVZaNDNMRTZkTFptOD0='
            },
            body: {
            },
            json: true

        };
        request(getToken1, function (error, response, body) {
            if (error) throw new Error(error)
            else {
                token1 = body.access_token
                let access_token1 = 'Bearer ' + token1;

                // get task id related to workflow id
                console.log(url1);
                console.log("get task id related to workflow id");
                var options1 = {
                    method: 'GET',
                    url: url1,
                    headers:
                    {
                        'postman-token': 'c460ea7e-6f8f-69ab-fade-2bb9c53978c3',
                        'cache-control': 'no-cache',
                        authorization: access_token1,
                        'content-type': 'application/json'
                    },
                    body: {
                    },
                    json: true
                };
                request(options1, function (error, response, body) {
                    if (error) throw new Error(error)
                    else {
                        let taskID = body[3].taskId;
                        console.log(taskID);
                        //console.log(access_token1);
                        var url2 = 'https://api.workflow-sap.cfapps.us10.hana.ondemand.com/workflow-service/rest/v1/task-instances/' + taskID;
                        var options2 = {
                            method: 'PATCH',
                            url: url2,
                            headers:
                            {
                                'postman-token': 'c460ea7e-6f8f-69ab-fade-2bb9c53978c3',
                                'cache-control': 'no-cache',
                                authorization: access_token1,
                                'content-type': 'application/json'
                            },
                            body: {
                                "context": {
                                    "approve": true
                                },
                                "status": "COMPLETED"
                            },
                            json: true
                        };
                        request(options2, function (error, response, body) {
                            if (error) throw new Error(error)
                            else {
                                console.log("Responder has submitted the response. Mail sent to the approver")
                            }
                        })
                    }
                });
            }
        });
    });

    //Third Scenario
    srv.after("CREATE", "ApproverDetails", async req => {
        const { FirstWorkflow, Approvers } = cds.entities('my.Test');
        const workflow_ID1 = await SELECT.columns`workflow_ID as ID`.from(FirstWorkflow).where({ project_ID: req.ProjectID })
        let InstanceID1 = workflow_ID1[0].ID;
        const all_approvers = await SELECT.columns`approveremail as SecondApprover`.from(Approvers).where({ ID: req.ProjectID })
        const approver = await SELECT.columns`approveremail as SecondApprover`.from(Approvers).where({ ID: req.ProjectID, UserID: req.UserID })
        let token2;
        //get token
        var getToken2 = {
            method: 'POST',
            url: 'https://7dcdf1e5trial.authentication.us10.hana.ondemand.com/oauth/token?grant_type=client_credentials',
            headers:
            {
                authorization: 'Basic c2ItY2xvbmUtMWVlMDI0MjUtNzRjZi00ZTU5LWFhNzYtMTg5YWY2M2E2ZmI0IWIzOTA1NXx3b3JrZmxvdyFiMTc3NDpkOGIwM2VjMi04NWY4LTQyMDMtYmI1Mi1jMTk0Mzg3ZjVjMzckRUtDSWZQVXREWFZOeTMtVlNiUDFLWkx1RDdLUm9jZVZaNDNMRTZkTFptOD0='
            },
            body: {
            },
            json: true

        };
        request(getToken2, function (error, response, body) {
            if (error) throw new Error(error)
            else {
                token2 = body.access_token
                let access_token2 = 'Bearer ' + token2;

                var url1 = 'https://api.workflow-sap.cfapps.us10.hana.ondemand.com/workflow-service/rest/v1/workflow-instances/' + InstanceID1 + '/execution-logs';
                var options2 = {
                    method: 'GET',
                    url: url1,
                    headers:
                    {
                        'postman-token': 'c460ea7e-6f8f-69ab-fade-2bb9c53978c3',
                        'cache-control': 'no-cache',
                        authorization: access_token2,
                        'content-type': 'application/json'
                    },
                    body: {
                    },
                    json: true
                };
                request(options2, function (error, response, body) {
                    if (error) throw new Error(error)
                    else {
                        for (let i = 0; i < all_approvers.length; i++) {
                            //console.log(body[10 + i].subflow.workflowInstanceId);
                            const workflowInstanceId = body[10 + i].subflow.workflowInstanceId
                            var url2 = 'https://api.workflow-sap.cfapps.us10.hana.ondemand.com/workflow-service/rest/v1/workflow-instances/' + workflowInstanceId + '/execution-logs';
                            var options3 = {
                                method: 'GET',
                                url: url2,
                                headers:
                                {
                                    'postman-token': 'c460ea7e-6f8f-69ab-fade-2bb9c53978c3',
                                    'cache-control': 'no-cache',
                                    authorization: access_token2,
                                    'content-type': 'application/json'
                                },
                                body: {
                                },
                                json: true
                            };
                            request(options3, function (error, response, body) {
                                if (error) throw new Error(error)
                                else {
                                    console.log(body[1].recipientUsers[0]);
                                    if (approver[0].SecondApprover == body[1].recipientUsers[0]) {

                                        let approver_taskID = body[1].taskId
                                        console.log(approver[0].SecondApprover, approver_taskID);


                                        var url3 = 'https://api.workflow-sap.cfapps.us10.hana.ondemand.com/workflow-service/rest/v1/task-instances/' + approver_taskID;
                                        var options4 = {
                                            method: 'PATCH',
                                            url: url3,
                                            headers:
                                            {
                                                'postman-token': 'c460ea7e-6f8f-69ab-fade-2bb9c53978c3',
                                                'cache-control': 'no-cache',
                                                authorization: access_token2,
                                                'content-type': 'application/json'
                                            },
                                            body: {
                                                "context": {
                                                    "approve": true
                                                },
                                                "status": "COMPLETED"
                                            },
                                            json: true
                                        };
                                        request(options4, function (error, response, body) {
                                            if (error) throw new Error(error)
                                            else {
                                                console.log("approved by ", approver[0].SecondApprover);
                                            }
                                        });

                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    });
}