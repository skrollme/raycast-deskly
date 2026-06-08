import { List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { fetchInformation, fetchPresentResources } from "./api/deskly";
import { PresentPerson } from "./lib/types";
import OfficeList, { OfficeListSection } from "./components/OfficeList";

export default function Command() {
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

  const sections: OfficeListSection[] = [...byRoom.entries()].map(([key, people]) => {
    const resource = people[0]?.dayBookings[0]?.resource;
    return {
      key,
      title: resource?.floorName ? `${resource.floorName} · ${resource.roomName}` : resource?.roomName ?? "Unknown",
      items: people.map((person) => {
        const booking = person.dayBookings[0];
        return {
          key: person.userId,
          profileImage: person.profileImage,
          title: `${person.firstName} ${person.lastName}`,
          subtitle: booking?.resource.name ?? "",
          isCheckedIn: person.isCheckedIn,
          timeRange:
            booking?.from && booking?.until
              ? `${booking.from.substring(0, 5)} – ${booking.until.substring(0, 5)}`
              : undefined,
        };
      }),
    };
  });

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
      <OfficeList sections={sections} />
    </List>
  );
}
