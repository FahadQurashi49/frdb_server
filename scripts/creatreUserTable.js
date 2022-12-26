var
    AWS = require("aws-sdk"),
    DDB = new AWS.DynamoDB({
        apiVersion: "",
        region: ""
    });

(function createUserTable() {
    var
        params = {
            AttributeDefinitions: [{
                AttributeName: "email",
                AttributeType: "S"
            }],
            KeySchema: [{
                AttributeName: "email",
                KeyType: "HASH"
            }],
            BillingMode: "PAY_PER_REQUEST",
            TableName: "frdb_user"
        };
    DDB.createTable(params, function (err, data) {
        console.log(err, data);
    });
})();
