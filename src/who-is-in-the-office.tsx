import { getPreferenceValues, Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { fetchInformation, fetchPresentResources } from "./api/deskly";
import { Preferences, PresentPerson } from "./lib/types";
import { profileIcon } from "./lib/utils";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);

  const { data: information, isLoading: infoLoading } = useCachedPromise(fetchInformation);

  const primaryLocation = information?.user?.primaryRoom?.location ?? undefined;
  const effectiveLocation = selectedLocation ?? primaryLocation;

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const { data: presentPeople, isLoading: peopleLoading } = useCachedPromise(
    fetchPresentResources,
    [effectiveLocation ?? "", dateStr],
    { execute: !!effectiveLocation }
  );

  const locations = information?.availableLocations ?? [];

  const byRoom = new Map<string, PresentPerson[]>();
  for (const person of presentPeople ?? []) {
    const resource = person.dayBookings[0]?.resource;
    const key = `${resource?.floorName ?? ""}::${resource?.roomName ?? "Unknown"}`;
    const group = byRoom.get(key) ?? [];
    group.push(person);
    byRoom.set(key, group);
  }

  return (
    <List
      isLoading={infoLoading || peopleLoading}
      searchBarAccessory={
        primaryLocation ? (
          <List.Dropdown tooltip="Filter by Location" defaultValue={primaryLocation} onChange={setSelectedLocation}>
            {locations.map((loc) => (
              <List.Dropdown.Item key={loc.id} value={loc.id} title={loc.name} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
    >
      {[...byRoom.entries()].map(([key, people]) => {
        const resource = people[0]?.dayBookings[0]?.resource;
        const sectionTitle = resource?.floorName
          ? `${resource.floorName} · ${resource.roomName}`
          : resource?.roomName ?? "Unknown";
        return (
          <List.Section key={key} title={sectionTitle}>
            {people.map((person) => (
              <List.Item
                key={person.userId}
                icon={profileIcon(person.profileImage, preferences.apiUrl)}
                title={`${person.firstName} ${person.lastName}`}
                subtitle={person.dayBookings[0]?.resource.name}
                accessories={[
                  ...(person.isCheckedIn ? [{ icon: Icon.CheckCircle }] : []),
                  {
                    text:
                      person.dayBookings[0]?.from && person.dayBookings[0]?.until
                        ? `${person.dayBookings[0].from.substring(0, 5)} – ${person.dayBookings[0].until.substring(
                            0,
                            5
                          )}`
                        : undefined,
                  },
                ]}
              />
            ))}
          </List.Section>
        );
      })}
    </List>
  );
}
