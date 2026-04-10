export const careerTree: Record<string, any> = {
  Science: [
    {
      name: "JEE (Engg)",
      exam: "JEE Mains / Advanced",
      duration: "4 years",
      subjects: ["Physics", "Chemistry", "Mathematics"],
      subBranches: [
        { name: "CSE", core: ["OS", "OOPs", "DBMS", "Computer Networks"], skills: ["Web Development", "Data Structures & Algorithms", "System Design"], career: ["Software Engineer", "Full Stack Developer"] },
        { name: "Electrical", core: ["Circuit Theory", "Control Systems", "Power Systems"], skills: ["IoT", "Robotics", "Embedded Systems"], career: ["Electrical Engineer", "Hardware Developer"] },
        { name: "AI/ML", core: ["Linear Algebra", "Prob. & Statistics", "Neural Networks"], skills: ["TensorFlow", "PyTorch", "Data Science"], career: ["Machine Learning Engineer", "Data Scientist"] },
        { name: "Mechanical", core: ["Thermodynamics", "Fluid Mechanics", "Kinetics"], skills: ["AutoCAD", "SolidWorks", "Manufacturing"], career: ["Mechanical Engineer", "Automotive Engineer"] }
      ]
    },
    {
      name: "NEET (Med)",
      exam: "NEET",
      duration: "5.5 years",
      subjects: ["Physics", "Chemistry", "Biology"],
      fields: ["MBBS", "BDS", "Pharmacy"],
      career: ["Doctor", "Surgeon", "Pharmacist"]
    },
    {
      name: "NDA (Defense)",
      exam: "NDA & NA Exam",
      duration: "3 + 1 years training",
      subjects: ["Mathematics", "General Ability (Physics, English, GK)"],
      fields: ["Indian Army", "Indian Navy", "Indian Air Force"],
      career: ["Commissioned Officer", "Fighter Pilot", "Commander"]
    }
  ],
  Commerce: [
    {
      name: "CA",
      exam: "CA Foundation",
      duration: "4.5 years",
      subjects: ["Accounting", "Business Law", "Economics", "Quantitative Aptitude"],
      fields: ["Accounting", "Auditing", "Taxation"],
      career: ["Chartered Accountant", "Financial Advisor"]
    },
    {
      name: "B.Com / BBA",
      exam: "CUET / Direct",
      duration: "3-4 years",
      subjects: ["Accountancy", "Business Studies", "Economics", "English"],
      fields: ["Business", "Management", "Finance"],
      career: ["Business Manager", "Entrepreneur", "Analyst"]
    }
  ],
  Arts: [
    {
      name: "Design",
      exam: "NID / UCEED / NIFT",
      duration: "4 years",
      subjects: ["Design Aptitude", "Logical Reasoning", "General Knowledge"],
      fields: ["Graphic Design", "UI/UX", "Fashion Design"],
      career: ["Designer", "Product Manager"]
    },
    {
      name: "Law",
      exam: "CLAT",
      duration: "5 years",
      subjects: ["English", "Current Affairs", "Legal Reasoning", "Logic"],
      fields: ["Corporate Law", "Criminal Law"],
      career: ["Lawyer", "Legal Advisor", "Judge"]
    },
    {
      name: "BA Gen",
      exam: "CUET",
      duration: "3-4 years",
      subjects: ["History", "Political Science", "Geography", "Sociology"],
      fields: ["Psychology", "History", "Literature"],
      career: ["Psychologist", "Professor", "Writer"]
    }
  ]
};