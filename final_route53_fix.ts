import { Route53Client, ListResourceRecordSetsCommand, ChangeResourceRecordSetsCommand } from "@aws-sdk/client-route-53";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand } from "@aws-sdk/client-elastic-beanstalk";

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
};

const r53 = new Route53Client({ region: "us-east-1", credentials });
const elb = new ElasticLoadBalancingV2Client({ region: "eu-north-1", credentials });
const eb = new ElasticBeanstalkClient({ region: "eu-north-1", credentials });

async function fix() {
  try {
    console.log("--- Scanning Resources ---");
    const envs = await eb.send(new DescribeEnvironmentsCommand({ EnvironmentNames: ["perala-live"] }));
    const env = envs.Environments?.[0];
    console.log("EB CNAME:", env?.CNAME);

    const lbs = await elb.send(new DescribeLoadBalancersCommand({}));
    const lb = lbs.LoadBalancers?.find(l => l.DNSName?.includes("perala-live"));
    console.log("LB DNS:", lb?.DNSName);
    console.log("LB Canonical Hosted Zone ID:", lb?.CanonicalHostedZoneId);

    if (lb && lb.CanonicalHostedZoneId) {
      console.log("\n--- Updating Route 53 to correct ALIAS ---");
      const change = await r53.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: "/hostedzone/Z0813290SYY7KV0312P0",
        ChangeBatch: {
          Changes: [
            {
              Action: "UPSERT",
              ResourceRecordSet: {
                Name: "perala.in.",
                Type: "A",
                AliasTarget: {
                  HostedZoneId: lb.CanonicalHostedZoneId,
                  DNSName: `dualstack.${lb.DNSName}.`,
                  EvaluateTargetHealth: false
                }
              }
            }
          ]
        }
      }));
      console.log("Route 53 Update Status:", change.ChangeInfo?.Status);
    } else {
      console.log("Error: Could not find valid Load Balancer or Hosted Zone ID");
    }
  } catch (err) {
    console.error("Fix Error:", err);
  }
}
fix();
