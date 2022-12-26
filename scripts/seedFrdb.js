const
    AWS = require("aws-sdk"),
    UUID4 = require("uuid").v4,
    DDB = new AWS.DynamoDB({
        apiVersion: "",
        region: ""
    });

function pushRestaurantData() {
    let restaurantItem = {};
    let restaurantArr = [];
    let params = {};
    const restaurant_data = require("frdb/frdbRestaurantData.json");
    restaurant_data.forEach((restaurant) => {
        restaurantItem = {
            PutRequest: {
                Item: {
                    id: {
                        "S": UUID4()
                    },
                    type: {
                        "S": restaurant.type
                    },
                    restaurant_name: {
                        "S": restaurant.restaurant_name
                    },
                    description: {
                        "S": restaurant.description
                    },
                    location: {
                        "S": restaurant.location
                    },
                    avg_rating: {
                        "N": restaurant.avg_rating.toString()
                    },
                    total_ratings: {
                        "N": restaurant.total_ratings.toString()
                    },
                    logo: {
                        "S": restaurant.logo
                    }
                }
            }
        };
        restaurantArr.push(restaurantItem);
    });
    params = {
        RequestItems: {
            "frdb": restaurantArr.reverse()
        }
    };
    console.log(restaurantArr[0]);
    console.log();
    console.log();
    console.log(restaurantArr[1]);
    console.log();
    console.log();
    // console.log(restaurantArr[8]);
    console.log(params);
    // return DDB.batchWriteItem(params).promise();
}

function pushReviewData() {
    let reviewItem = {};
    let reviewArr = [];
    let params = {};
    const review_data = require("frdb/frdbReviewData.json");
    review_data.forEach((review) => {
        reviewItem = {
            PutRequest: {
                Item: {
                    id: {
                        "S": UUID4()
                    },
                    type: {
                        "S": review.type
                    },
                    review_text: {
                        "S": review.review_text
                    },
                    restaurant_id: {
                        "S": review.restaurant_id
                    },
                    user_id: {
                        "S": review.user_id
                    },
                    rating: {
                        "N": review.rating.toString()
                    },
                    create_date: {
                        "N": new Date().getTime().toString()
                    },
                    imgs: {
                        "S": review.imgs
                    }
                }
            }
        };
        reviewArr.push(reviewItem);
    });
    params = {
        RequestItems: {
            "frdb": reviewArr.reverse()
        }
    };
    console.log(reviewArr[0]);
    console.log();
    console.log();
    console.log(reviewArr[1]);
    console.log();
    console.log();
    // console.log(reviewArr[8]);
    // console.log(params);
    // return DDB.batchWriteItem(params).promise();
}

(async function seed(){
    console.time("HowFastWasThat");
    console.log(await Promise.all([
            pushReviewData()
    ]));
    console.timeEnd("HowFastWasThat");
})();