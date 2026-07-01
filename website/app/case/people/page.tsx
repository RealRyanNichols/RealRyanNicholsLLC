import { redirect } from "next/navigation";

// There is no people index — individual profiles live at /case/people/[slug].
// The bare URL used to 404; send visitors to the people/clue hub instead so
// the case section has no dead ends.
export default function CasePeopleIndex() {
  redirect("/case/nexus");
}
