import { environment, updateCommandMetadata } from "@raycast/api";
import { getAuthToken } from "./api/desklyApi";

export default async function Command() {
  console.log(environment.launchType);
  await updateCommandMetadata({ subtitle: `456` });
}
