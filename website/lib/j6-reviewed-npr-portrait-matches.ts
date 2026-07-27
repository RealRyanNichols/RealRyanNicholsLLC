/**
 * Manually reviewed NPR portrait matches whose profile and NPR names are not
 * exact full-name matches.
 *
 * Every row is fail-closed to one immutable profile id, the profile name that
 * was reviewed, one NPR full name, and one NPR asset filename. The sync must
 * reject the row if any of those values changes. These are source-documented
 * editorial-use matches, not public-domain or license determinations.
 */
export type ReviewedNprPortraitMatch = {
  profileId: string;
  expectedProfileName: string;
  nprName: string;
  photoFilename: string;
  corroboration: string;
};

export const REVIEWED_NPR_PORTRAIT_MATCHES: ReviewedNprPortraitMatch[] = [
  {
    profileId: "426098fe-dfd5-4d02-beba-c838ea993762",
    expectedProfileName: "Christopher Roe",
    nprName: "Christopher Brian Roe",
    photoFilename: "roe-christopher-brian.jpg",
    corroboration: "D.D.C. case 23-mj-161 and linked CourtListener filing",
  },
  {
    profileId: "9089e378-905c-44c5-8b7e-1a933914ba00",
    expectedProfileName: "Barbara Yazmin Balmaseda",
    nprName: "Barbara Balmaseda",
    photoFilename: "balmaseda-barbara.jpg",
    corroboration:
      "D.D.C. case 1:23-mj-00352-ZMF and linked CourtListener filing",
  },
  {
    profileId: "f06ff57a-86a1-4141-aa2d-0571f37a639e",
    expectedProfileName: "Barry Bennet Ramey",
    nprName: "Barry Bennett Ramey",
    photoFilename: "ramey-barry-bennet.jpg",
    corroboration: "D.D.C. case 1:22-mj-83 and linked CourtListener filing",
  },
  {
    profileId: "14f82456-fcdc-4b5f-a9e9-429f8003f9cb",
    expectedProfileName: "Jennifer Leigh Ryan(Jenna Ryan)",
    nprName: "Jennifer Leigh Ryan",
    photoFilename: "ryan-jennifer-leigh.jpg",
    corroboration: "D.D.C. case 1:21-cr-50 and linked CourtListener filing",
  },
  {
    profileId: "808c91a7-c23c-461e-94f1-64d996693d52",
    expectedProfileName: "James McGrew",
    nprName: "James Burton McGrew",
    photoFilename: "mcgrew-james-burton.jpg",
    corroboration: "D.D.C. case 1:21-cr-398 and linked CourtListener filing",
  },
  {
    profileId: "28c57cf1-5a36-408f-84af-568920e5ed27",
    expectedProfileName: "Kash Kelly",
    nprName: "Kash Lee Kelly",
    photoFilename: "kelly-kash-lee.jpg",
    corroboration: "D.D.C. case 1:22-cr-208 and linked CourtListener filing",
  },
  {
    profileId: "62df2d21-0576-4488-a951-648a89a14bc2",
    expectedProfileName: "Jacquelyn Jennifer Starer",
    nprName: "Jacquelyn Starer",
    photoFilename: "starer-jacquelyn.jpg",
    corroboration:
      "D.D.C. case 1:23-cr-00260-TJK and linked CourtListener filing",
  },
  {
    profileId: "00e751ad-f88f-4192-9676-c010171de5cc",
    expectedProfileName: "Daniel Egtvedt",
    nprName: "Daniel Dean Egtvedt",
    photoFilename: "egtvedt-daniel-dean.jpg",
    corroboration: "D.D.C. case 1:21-cr-177 and linked CourtListener filing",
  },
  {
    profileId: "43f33020-18a8-44c6-93e3-048ecef4359d",
    expectedProfileName: "Clayton Mullins",
    nprName: "Clayton Ray Mullins",
    photoFilename: "mullins-clayton-ray.jpg",
    corroboration: "D.D.C. case 1:21-cr-35 and linked CourtListener filing",
  },
  {
    profileId: "e2952457-3682-4bbe-b551-0711174e5b67",
    expectedProfileName: "Jacob Zerkle",
    nprName: "Jacob L. Zerkle",
    photoFilename: "zerkle-jacob-l.jpg",
    corroboration: "D.D.C. case 1:22-mj-60 and linked CourtListener filing",
  },
  {
    profileId: "40172e08-8acc-4509-8bf5-c86bab2168e4",
    expectedProfileName: "John Emanuel Banuelos",
    nprName: "John Banuelos",
    photoFilename: "banuelos-john.jpg",
    corroboration:
      "D.D.C. case 1:24-cr-00135-TSC and linked CourtListener filing",
  },
  {
    profileId: "a118bf25-6afa-4726-a85d-e865f290f4cf",
    expectedProfileName: "Jessica Watkins",
    nprName: "Jessica Marie Watkins",
    photoFilename: "watkins-jessica-marie.jpg",
    corroboration: "D.D.C. case 1:22-cr-15 and linked CourtListener filing",
  },
  {
    profileId: "910ee3f7-b035-49b2-beb2-9b8ccfc8c36f",
    expectedProfileName: "Edward E. Hemenway II",
    nprName: "Edward E. Hemenway",
    photoFilename: "hemenway-edward-e.jpg",
    corroboration: "D.D.C. case 1:21-cr-49 and linked CourtListener filing",
  },
  {
    profileId: "d9ede40c-b2d1-469a-a37d-c09691b93d44",
    expectedProfileName: "Jared Samuel Kastner",
    nprName: "Jared Kastner",
    photoFilename: "kastner-jared.jpg",
    corroboration: "D.D.C. case 1:21-cr-725 and linked CourtListener filing",
  },
  {
    profileId: "af2d2e84-726d-4d3f-a1c2-9a2330d32ccb",
    expectedProfileName: "Cindy Lou Young",
    nprName: "Cindy Young",
    photoFilename: "young-cindy.jpg",
    corroboration:
      "D.D.C. case 1:23-cr-00241 and linked CourtListener filing",
  },
  {
    profileId: "4529a7f9-cecf-4d91-a036-af9eea0d0c3c",
    expectedProfileName: "Edward Rodriguez",
    nprName: "Edward Francisco Rodriguez",
    photoFilename: "rodriguez-edward-francisco.jpg",
    corroboration: "D.D.C. case 1:21-cr-483 and linked CourtListener filing",
  },
  {
    profileId: "e5acb259-3048-4997-add1-16a6ff5b9b21",
    expectedProfileName: "Jesus Delmora Rivera",
    nprName: "Jesus D. Rivera",
    photoFilename: "rivera-jesus-jesus-d.jpg",
    corroboration: "D.D.C. case 1:21-cr-60 and linked CourtListener filing",
  },
  {
    profileId: "fd37e04a-6844-476b-af57-fe37ab7343cd",
    expectedProfileName: "Thomas Frank Sibick",
    nprName: "Thomas F. Sibick",
    photoFilename: "sibick-thomas-f.jpg",
    corroboration:
      "D.D.C. case 1:21-cr-00291-ABJ and linked CourtListener filing",
  },
  {
    profileId: "784b5889-e20d-48e9-9131-f06f47e05b44",
    expectedProfileName: "Christian Alexander Secor",
    nprName: "Christian Secor",
    photoFilename: "secor-christian.jpg",
    corroboration: "D.D.C. case 1:21-cr-157 and linked CourtListener filing",
  },
  {
    profileId: "0dca3d47-5805-4baa-b5de-e91d651865f0",
    expectedProfileName: "Steven Patrick Cook",
    nprName: "Steven Cook",
    photoFilename: "cook-steven.jpg",
    corroboration:
      "D.D.C. case 1:23-cr-00340 and linked CourtListener filing",
  },
  {
    profileId: "7628cc31-57de-4a80-b212-f4fdc9b46651",
    expectedProfileName: "Bradley James Bokoski",
    nprName: "Bradley Bokoski",
    photoFilename: "bokoski-bradley.jpg",
    corroboration:
      "D.D.C. case 1:22-cr-00207-CRC and linked CourtListener filing",
  },
  {
    profileId: "69b6d29a-cd76-4ae6-b989-6ffd5878e0bd",
    expectedProfileName: "Matthew R. Bokoski",
    nprName: "Matthew Bokoski",
    photoFilename: "bokoski-matthew.jpg",
    corroboration:
      "D.D.C. case 1:22-cr-00207-CRC and linked CourtListener filing",
  },
  {
    profileId: "b1fd40a1-709b-4300-9b53-0e0807195f6d",
    expectedProfileName: "Raymund Cholod",
    nprName: "Raymund Joseph Cholod",
    photoFilename: "cholod-raymund-joseph.jpg",
    corroboration: "D.D.C. case 1:22-mj-237 and linked CourtListener filing",
  },
  {
    profileId: "c29d29e8-a9db-4b9f-b9ee-096057714d5e",
    expectedProfileName: "Christopher Quaglin",
    nprName: "Christopher Joseph Quaglin",
    photoFilename: "quaglin-christopher-joseph.jpg",
    corroboration: "D.D.C. case 1:21-cr-40 and linked CourtListener filing",
  },
  {
    profileId: "7b553d6f-8a6e-4cc7-bd88-ec353933f97e",
    expectedProfileName: "Henry Muntzer",
    nprName: "Henry Phillip Muntzer",
    photoFilename: "muntzer-henry-phillip.jpg",
    corroboration: "D.D.C. case 1:21-cr-105 and linked CourtListener filing",
  },
  {
    profileId: "41f01739-0bae-42b3-8bb2-bfedfc3b739d",
    expectedProfileName: "Joshua Johnson",
    nprName: "Joshua Edward Johnson",
    photoFilename: "johnson-joshua-edward.jpg",
    corroboration: "D.D.C. case 1:22-cr-80 and linked CourtListener filing",
  },
  {
    profileId: "f8a21cef-20b8-473a-8b72-d3eac6039091",
    expectedProfileName: "Matthew Krol",
    nprName: "Matthew Thomas Krol",
    photoFilename: "krol-matthew-thomas.jpg",
    corroboration: "D.D.C. case 1:22-mj-18 and linked CourtListener filing",
  },
  {
    profileId: "726d6050-0579-40b1-ab4b-59e55940ce75",
    expectedProfileName: "Leonard Pearson Ridge IV",
    nprName: "Leonard Pearson Ridge",
    photoFilename: "ridge-leonard-pearso.jpg",
    corroboration: "D.D.C. case 1:21-cr-406 and linked CourtListener filing",
  },
  {
    profileId: "ea969dec-fc07-49c1-b049-b4d324e27aac",
    expectedProfileName: "Jacob Michael Therres",
    nprName: "Jacob Therres",
    photoFilename: "therres-jacob.jpg",
    corroboration: "D.D.C. case 1:22-cr-381 and linked CourtListener filing",
  },
  {
    profileId: "e49aa04e-13d2-4bc6-b515-04ca482934d6",
    expectedProfileName: "Treniss Jewell Evans III",
    nprName: "Treniss Jewel Evans III",
    photoFilename: "evans-treniss-jewel.jpg",
    corroboration: "D.D.C. case 1:21-cr-225 and linked CourtListener filing",
  },
  {
    profileId: "7b23c104-cac6-40d9-b81b-805807e2035d",
    expectedProfileName: "Isreal Easterday",
    nprName: "Isreal James Easterday",
    photoFilename: "easterday-israel.jpg",
    corroboration: "D.D.C. case 1:22-cr-404 and linked CourtListener filing",
  },
  {
    profileId: "85f21978-1f0d-4a0c-a122-e3f080f9b742",
    expectedProfileName: "Shane Jenkins",
    nprName: "Shane Leedon Jenkins",
    photoFilename: "jenkins-shane.jpg",
    corroboration: "D.D.C. case 1:21-cr-245 and linked CourtListener filing",
  },
  {
    profileId: "72ca155f-60b6-49c5-8554-21c8fa0b28f9",
    expectedProfileName: "Riley Kasper",
    nprName: "Riley D. Kasper",
    photoFilename: "kasper-riley-d.jpg",
    corroboration: "D.D.C. case 1:22-mj-64 and linked CourtListener filing",
  },
  {
    profileId: "3a3b7daa-4bbf-461c-afe3-23236a866dec",
    expectedProfileName: "Ronnie Sandlin",
    nprName: "Ronald Sandlin",
    photoFilename: "sandlin-ronald.jpg",
    corroboration:
      "D.D.C. case 1:21-cr-88 and DOJ defendant record for Ronald L. Sandlin",
  },
  {
    profileId: "36efce9b-084e-4714-afdb-5e7066285df2",
    expectedProfileName: "John Anthony Schubert",
    nprName: "John A Schubert Jr.",
    photoFilename: "schubert-john-jr.jpg",
    corroboration:
      "D.D.C. matter 1:21-mj-495, arrest date, and DOJ defendant record",
  },
  {
    profileId: "38c43469-a22a-46f0-a1cd-12a10ce404dc",
    expectedProfileName: "Thomas Gallagher",
    nprName: "Thomas Gallagher",
    photoFilename: "gallagher-thomas.jpg",
    corroboration:
      "D.D.C. case 1:21-cr-41 and DOJ record distinguish the N.D. Georgia namesake",
  },
];
