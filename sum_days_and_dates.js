db.projects.aggregate([
    {
        $unwind: "$periodExtensions"
    },
    {
        $project: {
            "datePeriod": {
                $cond: {
                    if: { 
                        $lte: [{$month: "$periodExtensions.dateOfApplication"},8] }, 
                        then: "$periodExtensions.days", 
                        else:  0
                }
            },
            "executionTime":1
        },
    },
    {
        $group: { 
            _id: "$_id",
            "perioddays": {$push: "$datePeriod"},
            "executionTime": {$first: "$executionTime"},
            "dias": {$sum: "$datePeriod"}
        },
    },
    {
        $project: {
            "finalDate": { $add: ["$executionTime.begin", {$multiply: ["$dias", 24*60*60000 ]}, {$multiply: ["$executionTime.days", 24*60*60000 ]}]},
            "days": {
                $trunc: {
                    $divide: [{
                        $subtract: [ 
                            {$add: ["$executionTime.begin", {$multiply: ["$dias", 24*60*60000 ]}, {$multiply: ["$executionTime.days", 24*60*60000 ]}]},
                            ISODate("2020-05-00T00:00:00Z")
                        ]}, 
                        24*60*60000
                    ]
                }
            } 
        }
    },
    {
        $project: {
            "value": {
                $switch: {
                    branches: [
                        { case: {
                            $and: [
                                {$gte: ["$days",1] },
                                {$lt: ["$days",30] },
                            ]
                            },
                            then: "APC"
                        },
                        { case: {$gt: ["$days",30]}, then: "DPL" },
                    ],
                    default: "FPL"
            }
            }
        }
    }
])