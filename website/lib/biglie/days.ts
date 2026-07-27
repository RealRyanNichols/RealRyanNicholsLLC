import type { EmailDay } from "@/lib/biglie/email-shell";
import { SITE } from "@/lib/site";

const REPORT = `${SITE.url}/thebiglie/report/index.html`;
const LANDING = `${SITE.url}/thebiglie`;
const BOOK = `${SITE.url}/book`;
const TIPS = `${SITE.url}/tell-your-story`;

const readBtn = { label: "Open The Report", href: REPORT, kind: "gold" as const };
const bookBtn = { label: "See Fighting Shadows", href: BOOK, kind: "ghost" as const };
const tipsBtn = { label: "Send Receipts", href: TIPS, kind: "ghost" as const };
const shareBtn = { label: "Share The BIG Lie", href: LANDING, kind: "ghost" as const };

/**
 * The BIG Lie 30-day sequence. Day 1 fires immediately on signup; days 2-30 go
 * out one per calendar day via the cron. Every factual "came true" item is a
 * public record cited in the report's endnotes. Ryan's voice: short lines, no
 * em dashes, receipts first.
 */
export const DAYS: EmailDay[] = [
  {
    day: 1,
    subject: "Here it is. The BIG Lie.",
    preview: "26,102 words I wrote in a cell with no internet. Read it now.",
    kicker: "You are in",
    title: "You asked for it. Here it is.",
    blocks: [
      { type: "p", text: "Thank you for putting your name on this. It matters more than you know." },
      { type: "p", text: "The BIG Lie is the report I wrote in solitary confinement, on a court issued laptop, off the government's own evidence. No internet. No library. Just what I could watch on that drive and reason out on paper." },
      { type: "buttons", buttons: [readBtn] },
      { type: "callout", kicker: "For the next 30 days", color: "gold", text: "One email a day from me. Not spam. A guided walk through what I found, what I lived, and what has come true since. Stories, the receipts, the charts, and a few questions only you can answer. Stay with it and by day 30 you will understand January 6 in a way almost nobody does." },
      { type: "poll", poll: { questionKey: "who_are_you", prompt: "First, so I know who I am writing to. Which one fits you best?", options: [
        { key: "j6_family", label: "A J6 defendant, or family of one" },
        { key: "journalist", label: "A journalist or researcher" },
        { key: "supporter", label: "A supporter who wants the truth out" },
        { key: "east_texan", label: "An East Texan / know Ryan locally" },
        { key: "curious", label: "Just found this and want to understand" },
      ] } },
      { type: "p", text: "Tomorrow I will show you exactly what I had to work with in there. It is a short list." },
    ],
  },
  {
    day: 2,
    subject: "A laptop, a thumb drive, three books, no internet",
    preview: "The whole inventory of what I built this with.",
    kicker: "The inventory",
    title: "What I had to work with.",
    blocks: [
      { type: "p", text: "People assume a report like this comes out of a newsroom, or a law office, with a team and a budget. Here is the honest inventory of what I built The BIG Lie with." },
      { type: "p", text: "<b>One court issued laptop.</b> Locked down. Loaded with the government's own discovery." },
      { type: "p", text: "<b>One evidence thumb drive.</b> 14,000+ hours of bodycam, CCTV and crowd video. Everything I could prove came off of it." },
      { type: "p", text: "<b>Three books.</b> Whatever made it through the mail. Every outside source in this report is something I could hold in my hands." },
      { type: "p", text: "<b>No internet.</b> Not restricted. None. I could not look anything up, check a date, or read the news." },
      { type: "lead", text: "And what was left of my sanity, in solitary confinement. That is the honest fifth item and I am not going to dress it up." },
      { type: "callout", kicker: "Why this matters", color: "blue", text: "Every single claim in this report had to survive being produced under those conditions. That is not a weakness. It is why it holds up." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 3,
    subject: "The men in C2B watched me write this",
    preview: "This is not hindsight. I wrote it in the cell, and there are witnesses.",
    kicker: "Verification",
    title: "I did not write this after the fact.",
    blocks: [
      { type: "p", text: "The easiest way to dismiss a report like this is to say I wrote it later, with hindsight, once the facts were known and it was safe." },
      { type: "p", text: "I did not." },
      { type: "p", text: "I wrote it in D.C. Department of Corrections. Pod C2B, and then solitary. The men who were in there with me can tell you so, because they watched me do it, day after day, on that laptop." },
      { type: "lead", text: "That is the whole point of the section you are about to read tomorrow. Everything I wrote was written before it was public." },
      { type: "poll", poll: { questionKey: "believe_written_inside", prompt: "Does it change how you read something, knowing it was written from inside a cell before the facts came out?", options: [
        { key: "yes_a_lot", label: "Yes, completely" },
        { key: "somewhat", label: "Somewhat" },
        { key: "show_me", label: "Show me the receipts first" },
      ] } },
    ],
  },
  {
    day: 4,
    subject: "What I saw in that tunnel",
    preview: "This part is not analysis. This part I lived.",
    kicker: "The tunnel",
    title: "The Lower West Terrace.",
    blocks: [
      { type: "p", text: "Most of the report is me working through footage. This part is not. This part I was in." },
      { type: "p", text: "I was in the Lower West Terrace tunnel. I was sprayed and beaten in there alongside men and women who are still not the same." },
      { type: "p", text: "I heard officers warn other officers that what they were doing was going to kill somebody. You can hear it yourself on the bodycam. You can watch officers trying to wave other officers off." },
      { type: "quote", text: "The tape is the tape. The bodycam does not change its story.", cite: "This is why I keep asking for the video and not the summary of the video." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 5,
    subject: "Rosanne Boyland died at the mouth of that tunnel",
    preview: "There is video. Nobody was charged. Weeks later that officer was honored.",
    kicker: "The tunnel",
    title: "What happened to Rosanne.",
    blocks: [
      { type: "p", text: "Rosanne Boyland died at the mouth of that tunnel. I was near enough to that spot to carry it with me." },
      { type: "p", text: "There is video of an officer striking her with a stick while she lay motionless on the ground. The Metropolitan Police reviewed it internally and called the force objectively reasonable. Nobody was charged." },
      { type: "then_now", then: "I wrote that what happened to her was not investigated the way a death should be.", now: "Her own family were denied the full autopsy report and have said publicly they were shut out of the investigation.", tag: "On the record" },
      { type: "callout", kicker: "Handle with care", color: "gold", text: "Her family are real people carrying real grief. I do not use her name to score points. I use it because the record deserves to be seen and her family deserve answers. If you share this, share it with that in mind." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 6,
    subject: "35 baton strikes. A judge called it harrowing. Then dismissed it.",
    preview: "Victoria White was beaten in that tunnel. Here is what the court did.",
    kicker: "The tunnel",
    title: "Victoria White.",
    blocks: [
      { type: "p", text: "Victoria White was beaten in that tunnel. Her lawsuit describes roughly 35 baton strikes to the head, neck and shoulders and five punches to the face." },
      { type: "then_now", then: "I wrote that the people beaten in that tunnel would never get their day in court.", now: "A federal judge read her case, called what happened to her harrowing, and dismissed it anyway on qualified immunity. No court has ever ruled the force was lawful. They ruled she cannot sue over it.", tag: "Came out after I wrote it" },
      { type: "lead", text: "She has thanked me for what I did in there. I am still not the same either. Neither is she." },
      { type: "buttons", buttons: [readBtn, tipsBtn] },
    ],
  },
  {
    day: 7,
    subject: "A government document nobody wants to talk about",
    preview: "MPD's own report named the marker for undercover officers in the crowd.",
    kicker: "The receipt",
    title: "Rainbow colored wristbands.",
    blocks: [
      { type: "p", text: "People call it a conspiracy theory to say law enforcement had their own people in that crowd. So let me hand you a government document." },
      { type: "quote", text: "MPD's own January 6th preparation report listed Rainbow Colored Wristbands as the marker signaling undercover MPD officers in the crowd.", cite: "Metropolitan Police Department preparation report. Corroborated independently by researcher Timothy Hale-Cusanelli." },
      { type: "lead", text: "That is not me. That is their paperwork. This is what turns a theory into a documented question." },
      { type: "poll", poll: { questionKey: "wristband_reaction", prompt: "Did you know law enforcement documented using markers to ID their own people in that crowd?", options: [
        { key: "no_new", label: "No. That is new to me." },
        { key: "suspected", label: "I suspected it, now I have the document" },
        { key: "knew", label: "I already knew this" },
      ] } },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 8,
    subject: "Infiltrate. Agitate. Retaliate.",
    preview: "The three word playbook, and where it actually comes from.",
    kicker: "The battle plan",
    title: "The playbook is not mine.",
    blocks: [
      { type: "p", text: "The framework in this report is not something I invented in a cell to feel better. It is a documented playbook with a long history. Three objectives. Infiltrate. Agitate. Retaliate." },
      { type: "p", text: "I laid it out from the books I had and then I matched it, role by role, against what I watched in the footage." },
      { type: "callout", kicker: "How to read me", color: "blue", text: "When I connect that playbook to that afternoon, I label it as my conclusion, not as a court finding. You will always know which is which. That honesty is the whole method." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 9,
    subject: "Nine jobs in that crowd",
    preview: "Medics. Scanner operators. Agitators. Suppliers. And who filled them.",
    kicker: "The roles",
    title: "Nine roles, one afternoon.",
    blocks: [
      { type: "p", text: "The playbook has nine roles. Medical support. Scanner and app operators. Agitators. Barricade builders. Suppliers. And more." },
      { type: "p", text: "In the report I take each one and show you who filled it that day, with stills from the footage and the exact question each one raises." },
      { type: "lead", text: "Tomorrow I am going to show you the one role that was empty. It is the most important thing on the whole chart." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 10,
    subject: "The one role that was empty",
    preview: "There is a role in the playbook that did not appear on Jan 6. I say so.",
    kicker: "The roles",
    title: "Honesty is the strongest evidence.",
    blocks: [
      { type: "p", text: "The playbook has a role for fire. Setting fires to drain police resources and create chaos. It is a documented part of how these operations work." },
      { type: "lead", text: "On January 6, that role was empty. Fire did not appear. And I say so, right on the chart, in plain words." },
      { type: "p", text: "I could have hidden that. It would have made my case look tidier. I left it because a record you can trust is a record that tells you what is missing." },
      { type: "callout", kicker: "This is why", color: "green", text: "When a man shows you the hole in his own argument, that is when you can believe the rest of it. That empty role is the most credible thing in the report." },
      { type: "poll", poll: { questionKey: "honesty_matters", prompt: "Does it build or break your trust when I show you the gap in my own case?", options: [
        { key: "builds", label: "Builds it. That is rare." },
        { key: "neutral", label: "Neutral" },
        { key: "breaks", label: "Breaks it" },
      ] } },
    ],
  },
  {
    day: 11,
    subject: "I wrote about Ray Epps in the cell. Then this happened.",
    preview: "Before it was national news, I wrote he needed explaining.",
    kicker: "It came true",
    title: "Ray Epps.",
    blocks: [
      { type: "then_now", then: "I wrote that Ray Epps needed to be explained, and that the silence around him was itself the story.", now: "September 2023: Epps was charged with a single misdemeanor. January 2024: sentenced to probation, no custody. What he did on camera is still on the record for anyone to weigh.", tag: "Happened after I wrote it" },
      { type: "p", text: "I am not telling you what to conclude about him. I am telling you I flagged it from a cell, with no news, and the story did not go away." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 12,
    subject: "The informant who rode home with him got nothing. He got 55 months.",
    preview: "I wrote the Proud Boys were infiltrated. Then the trial proved it.",
    kicker: "It came true",
    title: "The Kansas City informant.",
    blocks: [
      { type: "then_now", then: "I wrote that the Proud Boys had been infiltrated, and that the informants inside would surface eventually.", now: "At the 2023 sedition trial, defense filings referenced as many as eight or nine informants in that orbit. One marched in with the Kansas City chapter, texted his handler while it happened, and rode home with Billy Chrestman. He was never charged.", tag: "Came out after I wrote it" },
      { type: "stat", value: "55 months", label: "What Chrestman got. The informant beside him got nothing." },
      { type: "p", text: "Same crowd. Same building. One man goes to prison for years. The other goes home. The difference is who he was working for." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 13,
    subject: "26 sources. I said the number would be hidden.",
    preview: "The DOJ Inspector General confirmed it in December 2024.",
    kicker: "It came true",
    title: "Twenty six.",
    blocks: [
      { type: "then_now", then: "I wrote that federal informants were embedded in that crowd, and that the government would not want to say how many.", now: "December 2024: the Justice Department Inspector General reported 26 confidential human sources were present in Washington on January 6, none authorized to enter the building or to encourage anyone else to.", tag: "Came out after I wrote it" },
      { type: "lead", text: "I wrote that in a cell, years earlier, with no way to know the number. The number came out. It was not zero." },
      { type: "poll", poll: { questionKey: "came_true_reaction", prompt: "Three days of things I wrote in the cell that later came out. What is your honest reaction?", options: [
        { key: "chills", label: "That gives me chills" },
        { key: "convinced", label: "It is convincing me" },
        { key: "coincidence", label: "Could be coincidence" },
        { key: "want_more", label: "Show me more" },
      ] } },
    ],
  },
  {
    day: 14,
    subject: "78 months at the top. Never charged at the bottom.",
    preview: "One chart that shows the whole disparity.",
    kicker: "The charts",
    title: "The sentencing disparity.",
    blocks: [
      { type: "p", text: "If you only look at one chart in the report, look at this one." },
      { type: "p", text: "Same building. Same afternoon. Mostly the same tunnel. At the top of the chart, 78 months in prison. At the bottom, never charged at all." },
      { type: "callout", kicker: "Every number is sourced", color: "green", text: "Each figure comes from a Justice Department release or a public court docket. The endnotes tell you which. I am not asking you to take my word for a single number." },
      { type: "buttons", buttons: [readBtn, shareBtn] },
    ],
  },
  {
    day: 15,
    subject: "Eight days for one man. Never, for two others.",
    preview: "How long it took to arrest people, side by side.",
    kicker: "The charts",
    title: "Days until arrest.",
    blocks: [
      { type: "p", text: "John Sullivan filmed inside the Capitol and sold the footage to two networks. Arrested in eight days." },
      { type: "p", text: "The man they call RedFace45 made contact with a police line with a shield. Arrested two and a half years later, and only after citizens did the identification work themselves." },
      { type: "p", text: "The man called PippiLongScarf was filmed inside that tunnel handing items to police. Never identified. Never charged. We asked the government to name him in a motion. Still nothing." },
      { type: "lead", text: "The gap between those bars is the whole argument. You do not need me to explain it. You just need to look." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 16,
    subject: "Still no name on a docket",
    preview: "The people filmed working with police who were never charged.",
    kicker: "The unnamed",
    title: "The ones with no name.",
    blocks: [
      { type: "p", text: "There are people in that footage, on camera, working with police in the middle of a riot, who were never identified and never charged." },
      { type: "p", text: "We asked the government to name one of them in a court motion. The answer was silence." },
      { type: "callout", kicker: "The absence is the evidence", color: "blue", text: "I cannot tell you who they are. Nobody can, because nobody with the power to name them has. That silence, documented and dated, is itself the point." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 17,
    subject: "The picture I could never draw for anyone",
    preview: "Every connection, every line labeled with what it actually is.",
    kicker: "The charts",
    title: "The connection web.",
    blocks: [
      { type: "p", text: "This is the chart I could describe to a cellmate but could never show anybody. Now it is drawn." },
      { type: "p", text: "Green is who informed. Blue is who was never identified. Red is who the hammer came down on. Every single line is labeled with what the relationship actually is, so nobody can accuse me of drawing a connection I did not earn." },
      { type: "poll", poll: { questionKey: "share_intent", prompt: "Have you shared any of this yet, or thought about it?", options: [
        { key: "shared", label: "Already shared it" },
        { key: "will", label: "I will after I read the full report" },
        { key: "thinking", label: "Thinking about who needs to see it" },
        { key: "not_yet", label: "Not yet" },
      ] } },
      { type: "buttons", buttons: [readBtn, shareBtn] },
    ],
  },
  {
    day: 18,
    subject: "His docket was sealed for two years",
    preview: "What a sealed case can hide, and why it matters.",
    kicker: "The unnamed",
    title: "Sealed.",
    blocks: [
      { type: "p", text: "One man in the report had his entire case sealed for roughly two years. Face paint, a bullhorn, at the front of the West Front. Sprayed officers. Then his docket went dark." },
      { type: "then_now", then: "I wrote that cooperation and sealed dockets were being used to hide who did what that day.", now: "When his case finally unsealed, it showed a guilty plea, cooperation, and a sentence far lighter than the conduct. All of it hidden while it mattered most.", tag: "Came out after I wrote it" },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 19,
    subject: "He sold the footage for $70,000",
    preview: "Filmed the whole thing. Sold it to two networks. Here is the record.",
    kicker: "The record",
    title: "John Sullivan.",
    blocks: [
      { type: "p", text: "John Sullivan walked in with a ballistic vest and a gas mask, filmed the whole thing, and on his own video said he brought his megaphone to instigate." },
      { type: "stat", value: "$70,000", label: "What two networks paid him for the footage, per the court forfeiture filing." },
      { type: "p", text: "Convicted at trial. Seventy two months. This is all in the record, and it is all in the report, with the docket numbers." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 20,
    subject: "You meant evil against me",
    preview: "The verse I held onto in there.",
    kicker: "Faith",
    title: "Genesis 50:20.",
    blocks: [
      { type: "p", text: "I am not going to preach at you. But you should know what carried me through solitary, because it is why this report exists instead of a broken man." },
      { type: "quote", text: "You meant evil against me, but God meant it for good.", cite: "Genesis 50:20" },
      { type: "p", text: "They meant that cell to end me. I turned it into a record. That is not me being clever. That is grace, and endurance, and refusing to disappear." },
      { type: "poll", poll: { questionKey: "what_moves_you", prompt: "What is drawing you to this the most?", options: [
        { key: "justice", label: "Justice and the double standard" },
        { key: "evidence", label: "The evidence and the method" },
        { key: "faith_story", label: "The faith and survival story" },
        { key: "j6_personal", label: "It is personal to me or my family" },
      ] } },
    ],
  },
  {
    day: 21,
    subject: "I am a father doing this in public",
    preview: "Why I rebuild where everyone can see it.",
    kicker: "The rebuild",
    title: "Why I do this in the open.",
    blocks: [
      { type: "p", text: "I am a father. I came out of that system with my name destroyed and a life to rebuild from nothing." },
      { type: "p", text: "I could have gone quiet. Plenty of people wanted me to. Instead I am building the whole thing where you can watch, because a record built in the open cannot be buried the way I was." },
      { type: "lead", text: "This list, this report, this work. It is how I earn, how I defend myself, and how I make sure what happened to me is on the record for the next person." },
      { type: "buttons", buttons: [bookBtn] },
    ],
  },
  {
    day: 22,
    subject: "I left the mistakes in",
    preview: "There is a lot I would change. I did not.",
    kicker: "The method",
    title: "I left it the way I wrote it.",
    blocks: [
      { type: "p", text: "There is a lot in this report I would say differently today. I know more now. Some of it I would sharpen. A few names I would think harder about." },
      { type: "lead", text: "I left it alone anyway." },
      { type: "p", text: "I fixed spelling and formatting, and where the public record has corrected me since, I say so on the page instead of quietly editing myself. You are reading what a man wrote in a cell in 2021, not what he wishes he had written in 2026." },
      { type: "callout", kicker: "The standard", color: "gold", text: "That is the only version worth publishing. Anything else is just me marking my own homework." },
    ],
  },
  {
    day: 23,
    subject: "How to read any record, for the rest of your life",
    preview: "The four labels. Once you see them you cannot unsee them.",
    kicker: "The method",
    title: "The four labels.",
    blocks: [
      { type: "p", text: "This is the most useful thing I can give you, and it works on every news story for the rest of your life." },
      { type: "p", text: "<b>Fact.</b> It is in the record. Go pull it yourself." },
      { type: "p", text: "<b>My account.</b> I lived it. This is my word." },
      { type: "p", text: "<b>Documented inference.</b> My conclusion, and I mark it as mine." },
      { type: "p", text: "<b>Needs authentication.</b> I believe it. I cannot prove it yet." },
      { type: "lead", text: "Every claim in the report wears one of those four tags. Now watch how much of what you read everywhere else refuses to tell you which one it is." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 24,
    subject: "583 days of video. Here is what you were shown.",
    preview: "The scale of what I watched versus what made the news.",
    kicker: "The charts",
    title: "What 14,000 hours looks like.",
    blocks: [
      { type: "p", text: "14,000 hours of footage is 583 days of continuous video. A year and seven months of never looking away." },
      { type: "p", text: "I had all of it in that cell. What the public was shown on the news would not fill a single square on the chart I built to show you the scale." },
      { type: "lead", text: "They had the whole haystack. They showed you a few frames. I watched the haystack." },
      { type: "buttons", buttons: [readBtn] },
    ],
  },
  {
    day: 25,
    subject: "Now it is your turn. Do you have something?",
    preview: "The record grows one receipt at a time.",
    kicker: "Your turn",
    title: "Send receipts.",
    blocks: [
      { type: "p", text: "This report exists because the government handed me its own evidence and I had the time to watch all of it. Most people who saw something that day have nowhere to put it." },
      { type: "p", text: "I built a place to put it. J6 defendants and families. Witnesses. Jail staff. Courthouse workers. East Texans. If you saw something, recorded something, or were handed something, it goes in the record." },
      { type: "callout", kicker: "How it works", color: "green", text: "You can send it without your name. Anonymous tips get labeled Needs Authentication and nothing publishes off an anonymous tip alone. Everything gets verified before anything runs." },
      { type: "poll", poll: { questionKey: "have_receipts", prompt: "Do you have something the record should see?", options: [
        { key: "yes_have", label: "Yes, I have something" },
        { key: "know_someone", label: "I know someone who does" },
        { key: "maybe", label: "Maybe, let me think" },
        { key: "no", label: "No, but I want to help" },
      ] } },
      { type: "buttons", buttons: [tipsBtn] },
    ],
  },
  {
    day: 26,
    subject: "The BIG Lie is what I could prove from a cell",
    preview: "Fighting Shadows is what they did to me to keep me in it.",
    kicker: "The book",
    title: "The whole story.",
    blocks: [
      { type: "p", text: "You have been reading what I could prove from a cell. There is a second half, and it is what they did to me to keep me in that cell." },
      { type: "p", text: "Fighting Shadows is the memoir. Years in custody. Solitary. Forced medical treatment. Due process violations a federal judge acknowledged on the record. The pardon that came years too late. And the part nobody writes about, which is rebuilding a life with your name already destroyed." },
      { type: "p", text: "Same method as the report. Labeled. Sourced. No claim bigger than what I can back." },
      { type: "buttons", buttons: [{ label: "Pre-order Fighting Shadows", href: BOOK, kind: "gold" }] },
      { type: "poll", poll: { questionKey: "book_interest", prompt: "Would you want the memoir?", options: [
        { key: "preorder_now", label: "Yes, taking me to pre-order" },
        { key: "when_out", label: "Tell me when it is out" },
        { key: "free_first", label: "Let me finish the free report first" },
      ] } },
    ],
  },
  {
    day: 27,
    subject: "Stop begging the algorithm",
    preview: "Why I built my own platform, and why you might need one too.",
    kicker: "The work",
    title: "Own your platform.",
    blocks: [
      { type: "p", text: "They tried to erase me on every platform I did not own. Suspended, throttled, buried. So I built land nobody can take. This site. This list. This report." },
      { type: "p", text: "If you are a business owner, a creator, an activist, a candidate, or anybody with a message the algorithm keeps burying, I build these for other people too. Same engine you are standing on right now." },
      { type: "buttons", buttons: [{ label: "Work With Me", href: `${SITE.url}/work-with-me`, kind: "ghost" }, bookBtn] },
    ],
  },
  {
    day: 28,
    subject: "Where this is going",
    preview: "The J6 Evidence Nexus, and why I am building it.",
    kicker: "The mission",
    title: "This is bigger than me.",
    blocks: [
      { type: "p", text: "The BIG Lie is one report. The bigger project is an evidence archive for every J6 defendant, family, attorney, and journalist who has documents scattered across drives and inboxes with nowhere to put them." },
      { type: "p", text: "Case profiles are free for J6 defendants. Always will be. I had a platform to build mine. Most people do not. That is what I am building next." },
      { type: "lead", text: "You reading this is part of it. One more person who cannot be told the record does not exist." },
      { type: "buttons", buttons: [readBtn, tipsBtn] },
    ],
  },
  {
    day: 29,
    subject: "Send it to the one person who called you crazy",
    preview: "The single most useful thing you can do with this.",
    kicker: "The ask",
    title: "Share it with one person.",
    blocks: [
      { type: "p", text: "You have almost finished 30 days of this. You understand January 6 now in a way almost nobody does." },
      { type: "p", text: "Here is the one ask I will make plainly. Send the report to one person who told you that you were crazy. Not a crowd. One person." },
      { type: "p", text: "Every chart in it has a share button built in, and a screenshot of any chart carries this site's address inside the image, so the truth finds its way home even when they crop out my name." },
      { type: "buttons", buttons: [shareBtn, readBtn] },
      { type: "poll", poll: { questionKey: "will_share_final", prompt: "Will you send it to one person today?", options: [
        { key: "done", label: "Already did" },
        { key: "today", label: "Yes, today" },
        { key: "this_week", label: "This week" },
      ] } },
    ],
  },
  {
    day: 30,
    subject: "You made it. Here is what you did.",
    preview: "Day 30. Not the end. The beginning.",
    kicker: "Day 30 of 30",
    title: "You made it to the end of the record.",
    blocks: [
      { type: "p", text: "Thirty days. You did not look away. That already puts you ahead of almost everyone who has an opinion about January 6." },
      { type: "h", text: "What you did over these 30 days" },
      { type: "p", text: "You read a report written in solitary with a laptop, a thumb drive, three books, and no internet. You saw what came true after it was written. You learned to read a record by its labels. And you know what happened in that tunnel." },
      { type: "callout", kicker: "You are not a spectator anymore", color: "green", text: "You are on the list. You know the method. You have the receipts. Whatever moved you most, that is your part of this to carry." },
      { type: "lead", text: "This is not the end. When there is a new filing, new footage, a records request that came back, you will hear it from me first, before any platform decides whether to show it to you." },
      { type: "buttons", buttons: [{ label: "Pre-order Fighting Shadows", href: BOOK, kind: "gold" }, shareBtn, tipsBtn] },
      { type: "p", text: "Thank you for standing on the record with me. Do not threaten anyone. Do not harass anyone. Read it. Share it. Send receipts." },
    ],
  },
];

export function getDay(n: number): EmailDay | undefined {
  return DAYS.find((d) => d.day === n);
}
export const TOTAL_DAYS = 30;
