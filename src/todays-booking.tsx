import { environment, updateCommandMetadata } from "@raycast/api";
export default async function Command() {
  console.log(environment.launchType);
  await updateCommandMetadata({ subtitle: `456` });
}
