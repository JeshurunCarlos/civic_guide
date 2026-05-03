export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ElectionStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ELECTION_STAGES: ElectionStep[] = [
  { id: "delimitation", title: "Delimitation", description: "Drawing boundaries for constituencies based on census data", icon: "Map" },
  { id: "electoral_rolls", title: "Electoral Rolls", description: "Updating the list of eligible voters across the country", icon: "Users" },
  { id: "notification", title: "Election Notification", description: "Official announcement of election dates by the ECI", icon: "Bell" },
  { id: "nomination", title: "Nomination & Scrutiny", description: "Candidates file papers which are then verified for eligibility", icon: "FileText" },
  { id: "campaigning", title: "Campaigning & MCC", description: "Parties outreach while following the Model Code of Conduct", icon: "Megaphone" },
  { id: "polling", title: "Polling Day", description: "Voters cast their ballots using EVMs and VVPATs", icon: "Fingerprint" },
  { id: "counting", title: "Counting & Results", description: "Votes are tallied and winners declared officially", icon: "Hash" },
  { id: "formation", title: "Government Formation", description: "Coalition building and swearing-in of the new government", icon: "Flag" }
];

export const QUIZ_DATA: Record<string, QuizQuestion[]> = {
  beginner: [
    {
      question: "Which commission is responsible for redrawing constituency boundaries?",
      options: ["Planning Commission", "Delimitation Commission", "Finance Commission"],
      correctIndex: 1,
      explanation: "Delimitation is the act of redrawing boundaries of constituencies based on recent census data to ensure equal representation."
    },
    {
      question: "What is the primary document used to verify a voter at a polling station?",
      options: ["Ration Card", "EPIC (Voter ID Card)", "PAN Card"],
      correctIndex: 1,
      explanation: "The Electoral Photo Identity Card (EPIC) is the primary document, though other electoral rolls verification documents are also accepted."
    },
    {
      question: "Who issues the official notification for general elections?",
      options: ["The President of India", "The Prime Minister", "The Chief Justice"],
      correctIndex: 0,
      explanation: "The President (for Lok Sabha) and Governor (for Assembly) issue the election notification following the recommendation of the ECI."
    },
    {
      question: "What happens during the 'Scrutiny' phase of nominations?",
      options: ["Votes are counted", "Nomination papers are checked for validity", "Campaign ads are approved"],
      correctIndex: 1,
      explanation: "Nomination and Scrutiny ensures that candidates meet all legal requirements and their papers are properly filed."
    },
    {
      question: "When does the Model Code of Conduct (MCC) come into force?",
      options: ["On the day of voting", "Immediately after the ECI announces the schedule", "When candidates file papers"],
      correctIndex: 1,
      explanation: "The Model Code of Conduct (MCC) for campaigning kicks in the moment the election schedule is announced."
    },
    {
      question: "Which of these is used to record votes in most Indian elections today?",
      options: ["Ballot Paper", "EVM (Electronic Voting Machine)", "Mobile App"],
      correctIndex: 1,
      explanation: "Polling day in India primarily uses Electronic Voting Machines (EVMs) for recording votes."
    },
    {
      question: "What does NOTA stand for on a ballot?",
      options: ["None of the Above", "Next Option To Approve", "No Other Trusted Authority"],
      correctIndex: 0,
      explanation: "NOTA allows voters to officially register their rejection of all candidates in a constituency."
    }
  ],
  wellversed: [
    {
      question: "Under which article of the Constitution is the Election Commission established?",
      options: ["Article 280", "Article 324", "Article 370"],
      correctIndex: 1,
      explanation: "Article 324 of the Constitution provides for the power of superintendence, direction, and control of elections to be vested in an Election Commission."
    },
    {
      question: "What is the maximum period allowed between two sessions of Parliament?",
      options: ["3 months", "6 months", "1 year"],
      correctIndex: 1,
      explanation: "After government formation, the house must meet as required by the constitution, with no more than 6 months between sessions."
    },
    {
      question: "Which system is used for elections to the Lok Sabha?",
      options: ["Proportional Representation", "First-Past-the-Post", "Single Transferable Vote"],
      correctIndex: 1,
      explanation: "India uses the First-Past-the-Post (FPTP) system for Lok Sabha elections, where the candidate with the most votes in a constituency wins."
    }
  ]
};

export const ELECTORAL_GLOSSARY = [
  { term: "Lok Sabha", definition: "The lower house of India's bicameral Parliament, with members directly elected by the people." },
  { term: "Rajya Sabha", definition: "The upper house of Parliament, representing states and union territories." },
  { term: "Model Code of Conduct (MCC)", definition: "Guidelines issued by the ECI for parties and candidates to ensure free and fair elections." },
  { term: "EVM", definition: "Electronic Voting Machine used to record and count votes electronically." },
  { term: "VVPAT", definition: "Voter Verifiable Paper Audit Trail, a device that provides physical verification of the electronic vote." },
  { term: "NOTA", definition: "None of the Above; an option allowing voters to reject all candidates in their constituency." },
  { term: "Delimitation", definition: "The act of redrawing boundaries of Lok Sabha and Assembly constituencies." },
  { term: "Constituency", definition: "A specific geographical area represented by an elected member." },
  { term: "Electoral Officer", definition: "Officials like the District Election Officer (DEO) who manage polling and counting locally." },
  { term: "Anti-Defection Law", definition: "Provisions in the 10th Schedule of the Constitution to prevent elected members from switching parties." }
];

export const EXTERNAL_RESOURCES = [
  {
    name: "Election Commission of India (ECI)",
    description: "Official portal for election schedules, results, and laws.",
    url: "https://eci.gov.in"
  },
  {
    name: "Voter Services Portal",
    description: "Digital platform for voter registration and epic downloads.",
    url: "https://voters.eci.gov.in"
  },
  {
    name: "PRS Legislative Research",
    description: "Non-partisan research on the work of the Indian Parliament.",
    url: "https://prsindia.org"
  },
  {
    name: "Association for Democratic Reforms (ADR)",
    description: "Analysis of candidate backgrounds and election spending.",
    url: "https://adrindia.org"
  }
];
