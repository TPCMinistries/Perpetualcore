"use client";

import { Badge } from "@/components/ui/badge";
import type { ExtractedPerson } from "@/lib/voice-intel/types";

interface PeopleListProps {
  people: string[] | ExtractedPerson[];
}

function isExtractedPerson(
  person: string | ExtractedPerson
): person is ExtractedPerson {
  return typeof person === "object" && "name" in person;
}

export function PeopleList({ people }: PeopleListProps) {
  if (!people || people.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {people.map((person, i) => {
        if (isExtractedPerson(person)) {
          return (
            <Badge
              key={`${person.name}-${i}`}
              variant="outline"
              className="text-xs gap-1"
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  person.is_known
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
              {person.name}
            </Badge>
          );
        }
        return (
          <Badge key={`${person}-${i}`} variant="outline" className="text-xs">
            {person}
          </Badge>
        );
      })}
    </div>
  );
}
