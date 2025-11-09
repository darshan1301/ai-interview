import { PrismaClient, Role } from "../generated/prisma";
import bcryptjs from "bcryptjs";
import { InterviewStatus } from "../src/utils/types";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  await prisma.question.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Hash passwords - All users have password "password123"
  const hashedPassword = await bcryptjs.hash("password123", 10);

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "john.doe@example.com",
        name: "John Doe",
        password: hashedPassword, // password: password123
        role: Role.CANDIDATE,
      },
    }),
    prisma.user.create({
      data: {
        email: "jane.smith@example.com",
        name: "Jane Smith",
        password: hashedPassword, // password: password123
        role: Role.CANDIDATE,
      },
    }),
    prisma.user.create({
      data: {
        email: "interviewer@example.com",
        name: "Sarah Johnson",
        password: hashedPassword, // password: password123
        role: Role.INTERVIEWER,
      },
    }),
    prisma.user.create({
      data: {
        email: "alex.chen@example.com",
        name: "Alex Chen",
        password: hashedPassword, // password: password123
        role: Role.CANDIDATE,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Interview 1: Completed interview with high score
  const interview1 = await prisma.interview.create({
    data: {
      userId: users[0].id,
      score: 85,
      status: InterviewStatus.COMPLETED,
      startTime: new Date("2025-11-01T10:00:00Z"),
      endTime: new Date("2025-11-01T10:45:00Z"),
      totalTime: 45,
      summary:
        "Strong performance across all areas. Demonstrated excellent problem-solving skills and clear communication. Shows deep understanding of data structures and algorithms. Could improve on system design complexity.",
      questions: {
        create: [
          {
            text: "Explain the difference between var, let, and const in JavaScript.",
            difficulty: "EASY",
            type: "TECHNICAL",
            answer:
              "var is function-scoped and can be redeclared, let is block-scoped and can be reassigned but not redeclared, and const is block-scoped and cannot be reassigned or redeclared.",
            isAnswered: true,
            score: 9,
          },
          {
            text: "What is the time complexity of searching in a balanced binary search tree?",
            difficulty: "MEDIUM",
            type: "TECHNICAL",
            answer:
              "O(log n) because at each step we eliminate half of the remaining nodes by choosing to go left or right.",
            isAnswered: true,
            score: 10,
          },
          {
            text: "Describe a time when you had to debug a complex issue in production.",
            difficulty: "MEDIUM",
            type: "BEHAVIORAL",
            answer:
              "In my previous role, we had a memory leak in our Node.js application. I used heap snapshots and Chrome DevTools to identify the issue was caused by event listeners not being properly removed. I implemented a cleanup mechanism and added monitoring.",
            isAnswered: true,
            score: 8,
          },
          {
            text: "Design a URL shortening service like bit.ly. Discuss the high-level architecture.",
            difficulty: "HARD",
            type: "SYSTEM_DESIGN",
            answer:
              "I would use a hash function to generate short codes, store mappings in a distributed database like Cassandra for scalability, implement a REST API, use Redis for caching popular URLs, and add analytics tracking.",
            isAnswered: true,
            score: 7,
          },
          {
            text: "Write a function to reverse a linked list.",
            difficulty: "MEDIUM",
            type: "CODING",
            answer:
              "I would use three pointers: prev, current, and next. Iterate through the list, reversing the next pointer of each node. The time complexity is O(n) and space complexity is O(1).",
            isAnswered: true,
            score: 9,
          },
          {
            text: "How do you handle conflicts within a team?",
            difficulty: "EASY",
            type: "BEHAVIORAL",
            answer:
              "I believe in direct but respectful communication. I would first listen to all perspectives, identify common goals, and facilitate a discussion to find a solution that works for everyone.",
            isAnswered: true,
            score: 8,
          },
        ],
      },
    },
  });

  // Interview 2: Completed interview with moderate score
  const interview2 = await prisma.interview.create({
    data: {
      userId: users[1].id,
      score: 65,
      status: InterviewStatus.COMPLETED,
      startTime: new Date("2025-11-03T14:00:00Z"),
      endTime: new Date("2025-11-03T14:50:00Z"),
      totalTime: 50,
      summary:
        "Good foundational knowledge with room for improvement. Shows potential in problem-solving but needs more practice with complex algorithms. Communication is clear. Would benefit from more hands-on experience with system design patterns.",
      questions: {
        create: [
          {
            text: "What is the difference between SQL and NoSQL databases?",
            difficulty: "EASY",
            type: "TECHNICAL",
            answer:
              "SQL databases are relational and use structured schemas, while NoSQL databases are non-relational and more flexible.",
            isAnswered: true,
            score: 7,
          },
          {
            text: "Explain the concept of closures in JavaScript.",
            difficulty: "MEDIUM",
            type: "TECHNICAL",
            answer:
              "A closure is when a function remembers variables from its outer scope even after the outer function has returned.",
            isAnswered: true,
            score: 6,
          },
          {
            text: "Describe your experience working in an Agile environment.",
            difficulty: "EASY",
            type: "BEHAVIORAL",
            answer:
              "I have worked in sprint-based teams with daily standups and retrospectives. We used Jira for task tracking.",
            isAnswered: true,
            score: 6,
          },
          {
            text: "How would you design a notification system for a social media platform?",
            difficulty: "HARD",
            type: "SYSTEM_DESIGN",
            answer:
              "I would use a message queue to handle notifications asynchronously, store preferences in a database, and use WebSockets for real-time delivery.",
            isAnswered: true,
            score: 5,
          },
          {
            text: "Find the first non-repeating character in a string.",
            difficulty: "MEDIUM",
            type: "CODING",
            answer:
              "I would use a hash map to count character frequencies, then iterate through the string again to find the first character with count 1.",
            isAnswered: true,
            score: 8,
          },
          {
            text: "What motivates you in your work?",
            difficulty: "EASY",
            type: "BEHAVIORAL",
            answer:
              "I am motivated by solving challenging problems and seeing the impact of my work on users.",
            isAnswered: true,
            score: 7,
          },
        ],
      },
    },
  });

  // Interview 3: In-progress interview with partial answers
  const interview3 = await prisma.interview.create({
    data: {
      userId: users[0].id,
      score: 0,
      status: "IN_PROGRESS",
      startTime: new Date("2025-11-08T09:00:00Z"),
      questions: {
        create: [
          {
            text: "What are the principles of Object-Oriented Programming?",
            difficulty: "EASY",
            type: "TECHNICAL",
            answer:
              "The four main principles are Encapsulation, Abstraction, Inheritance, and Polymorphism.",
            isAnswered: true,
            score: 0,
          },
          {
            text: "Explain the CAP theorem in distributed systems.",
            difficulty: "HARD",
            type: "TECHNICAL",
            answer:
              "CAP theorem states that a distributed system can only guarantee two out of three: Consistency, Availability, and Partition tolerance.",
            isAnswered: true,
            score: 0,
          },
          {
            text: "Tell me about a project you're most proud of.",
            difficulty: "MEDIUM",
            type: "BEHAVIORAL",
            answer:
              "I built a real-time analytics dashboard that reduced report generation time from hours to seconds using WebSockets and Redis.",
            isAnswered: true,
            score: 0,
          },
          {
            text: "Implement a function to detect a cycle in a linked list.",
            difficulty: "MEDIUM",
            type: "CODING",
            answer: "",
            isAnswered: false,
            score: 0,
          },
          {
            text: "Design a rate limiting system for an API.",
            difficulty: "HARD",
            type: "SYSTEM_DESIGN",
            answer: "",
            isAnswered: false,
            score: 0,
          },
          {
            text: "How do you prioritize tasks when you have multiple deadlines?",
            difficulty: "EASY",
            type: "BEHAVIORAL",
            answer: "",
            isAnswered: false,
            score: 0,
          },
        ],
      },
    },
  });

  // Interview 4: Completed interview with low score
  const interview4 = await prisma.interview.create({
    data: {
      userId: users[3].id,
      score: 45,
      status: InterviewStatus.COMPLETED,
      startTime: new Date("2025-11-05T11:00:00Z"),
      endTime: new Date("2025-11-05T11:55:00Z"),
      totalTime: 55,
      summary:
        "Needs significant improvement in technical fundamentals. Several questions were not answered or answered incorrectly. Recommend reviewing core concepts in data structures and algorithms before the next interview.",
      questions: {
        create: [
          {
            text: "What is a Promise in JavaScript?",
            difficulty: "EASY",
            type: "TECHNICAL",
            answer:
              "A Promise is an object that represents a future value that will be available.",
            isAnswered: true,
            score: 5,
          },
          {
            text: "Explain the difference between authentication and authorization.",
            difficulty: "EASY",
            type: "TECHNICAL",
            answer: "",
            isAnswered: true,
            score: 0,
          },
          {
            text: "Describe a situation where you had to learn a new technology quickly.",
            difficulty: "MEDIUM",
            type: "BEHAVIORAL",
            answer:
              "I had to learn React for a project. I watched tutorials and built a sample app.",
            isAnswered: true,
            score: 5,
          },
          {
            text: "Write a function to check if a string is a palindrome.",
            difficulty: "EASY",
            type: "CODING",
            answer:
              "I would compare the string with its reverse using string methods.",
            isAnswered: true,
            score: 6,
          },
          {
            text: "How would you design a scalable chat application?",
            difficulty: "HARD",
            type: "SYSTEM_DESIGN",
            answer: "",
            isAnswered: true,
            score: 0,
          },
          {
            text: "What are your salary expectations?",
            difficulty: "MEDIUM",
            type: "BEHAVIORAL",
            answer:
              "I am looking for a competitive salary based on market rates for this position.",
            isAnswered: true,
            score: 6,
          },
        ],
      },
    },
  });

  // Interview 5: Fresh interview just started
  const interview5 = await prisma.interview.create({
    data: {
      userId: users[1].id,
      score: 0,
      status: "IN_PROGRESS",
      startTime: new Date("2025-11-09T10:30:00Z"),
      questions: {
        create: [
          {
            text: "What is the difference between == and === in JavaScript?",
            difficulty: "EASY",
            type: "TECHNICAL",
            answer: "",
            isAnswered: false,
            score: 0,
          },
          {
            text: "Explain how garbage collection works in JavaScript.",
            difficulty: "MEDIUM",
            type: "TECHNICAL",
            answer: "",
            isAnswered: false,
            score: 0,
          },
          {
            text: "Tell me about a time you failed and what you learned from it.",
            difficulty: "MEDIUM",
            type: "BEHAVIORAL",
            answer: "",
            isAnswered: false,
            score: 0,
          },
          {
            text: "Implement a function to find the maximum depth of a binary tree.",
            difficulty: "MEDIUM",
            type: "CODING",
            answer: "",
            isAnswered: false,
            score: 0,
          },
          {
            text: "Design a caching strategy for a high-traffic e-commerce website.",
            difficulty: "HARD",
            type: "SYSTEM_DESIGN",
            answer: "",
            isAnswered: false,
            score: 0,
          },
          {
            text: "How do you handle feedback and criticism?",
            difficulty: "EASY",
            type: "BEHAVIORAL",
            answer: "",
            isAnswered: false,
            score: 0,
          },
        ],
      },
    },
  });

  // Interview 6: Excellent performance
  const interview6 = await prisma.interview.create({
    data: {
      userId: users[3].id,
      score: 92,
      status: InterviewStatus.COMPLETED,
      startTime: new Date("2025-11-07T15:00:00Z"),
      endTime: new Date("2025-11-07T15:40:00Z"),
      totalTime: 40,
      summary:
        "Outstanding performance. Demonstrated expert-level knowledge in algorithms and system design. Excellent problem-solving approach and communication skills. Shows leadership qualities and deep technical expertise. Strong hire recommendation.",
      questions: {
        create: [
          {
            text: "What are React Hooks and why were they introduced?",
            difficulty: "MEDIUM",
            type: "TECHNICAL",
            answer:
              "Hooks were introduced to allow functional components to use state and lifecycle methods without writing class components. They make code more reusable and easier to test.",
            isAnswered: true,
            score: 10,
          },
          {
            text: "Explain the difference between horizontal and vertical scaling.",
            difficulty: "MEDIUM",
            type: "TECHNICAL",
            answer:
              "Horizontal scaling means adding more machines, while vertical scaling means adding more resources to existing machines. Horizontal scaling is generally more reliable and cost-effective for distributed systems.",
            isAnswered: true,
            score: 9,
          },
          {
            text: "Describe how you would mentor a junior developer.",
            difficulty: "MEDIUM",
            type: "BEHAVIORAL",
            answer:
              "I would start by understanding their current skill level and goals, provide hands-on guidance through pair programming, conduct regular code reviews with constructive feedback, and gradually increase complexity of tasks while being available for questions.",
            isAnswered: true,
            score: 10,
          },
          {
            text: "Design a distributed task scheduling system like Cron.",
            difficulty: "HARD",
            type: "SYSTEM_DESIGN",
            answer:
              "I would use a coordinator service with leader election, distribute tasks across worker nodes using consistent hashing, implement fault tolerance with retries and dead letter queues, use a distributed lock mechanism like Redis or ZooKeeper, and add monitoring and alerting.",
            isAnswered: true,
            score: 9,
          },
          {
            text: "Implement an LRU (Least Recently Used) cache.",
            difficulty: "HARD",
            type: "CODING",
            answer:
              "I would use a HashMap for O(1) access and a doubly linked list to track recency. The HashMap stores key-node pairs, and the list maintains order. On access, move node to front. On capacity, remove tail node.",
            isAnswered: true,
            score: 9,
          },
          {
            text: "What is your approach to staying updated with new technologies?",
            difficulty: "EASY",
            type: "BEHAVIORAL",
            answer:
              "I regularly read tech blogs, contribute to open source, attend conferences, participate in coding challenges, and experiment with new technologies in side projects.",
            isAnswered: true,
            score: 9,
          },
        ],
      },
    },
  });

  console.log("✅ Created 6 interviews with 6 questions each");

  // Log summary
  const totalUsers = await prisma.user.count();
  const totalInterviews = await prisma.interview.count();
  const totalQuestions = await prisma.question.count();

  console.log("\n📊 Seeding Summary:");
  console.log(`   Users: ${totalUsers}`);
  console.log(`   Interviews: ${totalInterviews}`);
  console.log(`   Questions: ${totalQuestions}`);
  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
