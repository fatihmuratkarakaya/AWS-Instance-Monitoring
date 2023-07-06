# AWS EC2 Instance Monitor

This AWS Lambda function monitors EC2 instances across different regions and sends a Slack notification using Block Kit.

## Prerequisites

- Node.js (version 18.X)
- `aws-sdk` package

## Setup

1. Clone the repository:

git clone https://github.com/fatihmuratkarakaya/AWS-Instance-Monitoring.git

2. Install the required packages:

npm install aws-sdk


3. Update the configuration variables in the code:

- Replace `SLACK_WEBHOOK_URL` with your Slack webhook URL. Update the `path` variable in the `options` object.

4. Deploy the code as an AWS Lambda function.

## Usage

The Lambda function will be triggered by an event and execute the `handler` function.

The function performs the following steps:

1. Retrieves a list of AWS regions using the `describeRegions` function.

2. Calls the `describeEC2Instances` function for each region to retrieve information about the running EC2 instances.

3. Converts the response data into Slack Block Kit using the `describeResponseToInstance` and `instanceToBlock` functions.

4. Sends the Block Kit message to Slack using the provided webhook URL.

Make sure to configure the necessary permissions for the Lambda function to access EC2 instances and send messages to Slack.

## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
