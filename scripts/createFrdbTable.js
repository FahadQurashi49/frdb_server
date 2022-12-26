var
    AWS = require("aws-sdk"),
    DDB = new AWS.DynamoDB({
        apiVersion: "",
        region: ""
    });

(function createFrdbTable() {
    var
        params = {
            AttributeDefinitions: [{
                AttributeName: "id",
                AttributeType: "S"
            }, {
                AttributeName: "type",
                AttributeType: "S"
            }],
            KeySchema: [{
                AttributeName: "id",
                KeyType: "HASH"
            }, {
                AttributeName: "type",
                KeyType: "RANGE"
            }],
            BillingMode: "PAY_PER_REQUEST",
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'restaurant_location_index',
                    KeySchema: [
                        {
                            AttributeName: 'location',
                            KeyType: 'HASH'
                        },
                        {
                            AttributeName: 'avg_rating',
                            KeyType: 'RANGE'
                        }
                    ],
                    Projection: {
                        NonKeyAttributes: [
                            'restaurant_name',
                            'description',
                            'total_ratings',
                            'logo',
                            "type",
                            "id"
                        ],
                        ProjectionType: 'INCLUDE'
                    },
                },
                {
                    IndexName: 'restaurant_review_index',
                    KeySchema: [
                        {
                            AttributeName: 'restaurant_id',
                            KeyType: 'HASH'
                        },
                        {
                            AttributeName: 'create_date',
                            KeyType: 'RANGE'
                        }
                    ],
                    Projection: {
                        NonKeyAttributes: [
                            'review_text',
                            'user_id',
                            'rating',
                            'imgs',
                            "type",
                            "id"
                        ],
                        ProjectionType: 'INCLUDE'
                    },
                },
            ],
            TableName: "frdb"
        };
    DDB.createTable(params, function (err, data) {
        console.log(err, data);
    });
})();
