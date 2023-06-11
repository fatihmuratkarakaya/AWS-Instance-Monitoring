const https = require('https')
const AWS = require('aws-sdk');
exports.handler = (event, context, callback) => {
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Return All Data coming from describeRegion and describeEC2Instances and convert them into Block Kit////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    async function getSlackDescribeResponse() {
        const regionResponse = await describeRegions()
        const regionNames = regionResponse.Regions.map(region => region.RegionName.toString())
        const ec2Responses = await Promise.all(regionNames.map(region => describeEC2Instances(region)))
        const blocks = ec2Responses.flatMap(response => {
            const instances = describeResponseToInstance(response)
            const blocks = instances.flatMap(instance => instanceToBlock(instance))
            return blocks
        })
        const message = {
            blocks: blocks
        }
        return message
    }
    ////////////////////////////////////////////////
    //Return all Regions that are currently in AWS//
    ////////////////////////////////////////////////
    async function describeRegions() {
        const ec2Client = new AWS.EC2();
        return new Promise((resolve, reject) => {
            ec2Client.describeRegions({}, (err, data) => {
                if (err) {
                    return reject(err)
                }
                else {
                    return resolve(data)
                }
            })
        })
    }
    ///////////////////////////////////////////////
    //Get All EC2 Instances using describeRegion //
    ///////////////////////////////////////////////
    async function describeEC2Instances(regionName) {
        const params = {
            Filters: [
                {'Name': 'instance-state-code', 'Values': ['0', '16'] },
                {Name: "instance-type",Values: ["g4ad.xlarge","g3s.xlarge","g3.16xlarge","g3.8xlarge","g3.4xlarge", "g4ad.2xlarge", "g4ad.4xlarge", "g4ad.8xlarge", "g4ad.16xlarge", "g4dn.xlarge", "g4dn.2xlarge", "g4dn.4xlarge", "g4dn.8xlarge", "g4dn.12xlarge", "g4dn.16xlarge", "g4dn.metal",]}]
        };
        const ec2Client = new AWS.EC2({ region: regionName });
        return new Promise((resolve, reject) => {
            ec2Client.describeInstances(params, (err, data) => {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve({ data: data, regionName: regionName });
                }
            });
        });
    }
    /////////////////////////////////////////////////////////////////////////
    //Return All Data coming from describeRegion and describe EC2 Instances//
    /////////////////////////////////////////////////////////////////////////
    function describeResponseToInstance(response) {
        const responseForAll = response.data.Reservations.flatMap(reservation => {
            return reservation.Instances.map(instance => {
                const nameTag = instance.Tags.find(tag => tag.Key === 'Name');
                return {
                    id: instance.InstanceId,
                    name: nameTag ? nameTag.Value : "Empty",
                    publicIp: instance.PublicIpAddress,
                    type: instance.InstanceType,
                    regionName: response.regionName
                };
            });
        });
        return responseForAll;
    }
    //////////////////////////////////////////////////////////////////////
    //Function to convert data as Slack Block Kit which is more readable//
    //////////////////////////////////////////////////////////////////////
    function instanceToBlock(instance) {
        return [
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": ":computer:Region: ".concat(instance.regionName)
                    },
                    {
                        "type": "mrkdwn",
                        "text": " Name: ".concat(instance.name)
                    },
                    {
                        "type": "mrkdwn",
                        "text": " Id: ".concat(instance.id)
                    },
                    {
                        "type": "mrkdwn",
                        "text": " Ip: ".concat(instance.publicIp)
                    },
                    {
                        "type": "mrkdwn",
                        "text": " Type: ".concat(instance.type)
                    },
                ]
            }
        ];
    }
    //////////////////////////////////////////////////////////////
    //Send All data to Slack using WebHook and use Lambda for it//
    //////////////////////////////////////////////////////////////
    const xpath = process.env.SLACK_WEBHOOK_URL;
    const options = {
        hostname: "hooks.slack.com",
        method: "POST",
        path: `${xpath}`
    };
    const entryMessage="Hello Team👋 \n These machines are pricey; turn them off if not in use.";
    const req = https.request(options,
        (res) => res.on("data", () => callback(null, "OK")));
    req.on("error", (error) => callback(JSON.stringify(error)));
    getSlackDescribeResponse()
        .then(message => {
            return req.write(JSON.stringify(message))
        })

};