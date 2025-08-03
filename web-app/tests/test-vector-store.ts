import {
  StoreVectorsInSupabase,
  SearchVectorsInNotebook,
} from "../tools/vectorStore";

// Test data with longer content to test chunking
const testContent = JSON.stringify([
  {
    filename: "long-document.pdf",
    content: `This is a comprehensive test document about machine learning and artificial intelligence that spans multiple paragraphs and contains substantial content to test the chunking functionality.

Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.

The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide. The primary aim is to allow the computers to learn automatically without human intervention or assistance and adjust actions accordingly.

Deep learning is a subset of machine learning in artificial intelligence that has networks capable of learning unsupervised from data that is unstructured or unlabeled. Also known as deep neural learning or deep neural network.

Natural Language Processing (NLP) is a branch of artificial intelligence that helps computers understand, interpret and manipulate human language. NLP draws from many disciplines, including computer science and computational linguistics, in its pursuit to fill the gap between human communication and computer understanding.

Computer vision is a field of artificial intelligence that trains computers to interpret and understand the visual world. Using digital images from cameras and videos and deep learning models, machines can accurately identify and classify objects — and then react to what they "see."

Neural networks are a series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates. In this sense, neural networks refer to systems of neurons, either organic or artificial in nature.`,
    status: "processed",
    uploadStatus: "uploaded",
    uploadPath: "test/path/long-document.pdf",
  },
  {
    filename: "web-dev-guide.pdf",
    content: `This comprehensive guide covers modern web development practices and technologies used in building scalable web applications.

React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components." React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.

Next.js is a React framework that gives you building blocks to create web applications. By framework, we mean Next.js handles the tooling and configuration needed for React, and provides additional structure, features, and optimizations for your application.

Node.js is an open-source, cross-platform, back-end JavaScript runtime environment that runs on the V8 engine and executes JavaScript code outside a web browser. Node.js lets developers use JavaScript to write command line tools and for server-side scripting—running scripts server-side to produce dynamic web page content before the page is sent to the user's web browser.

PostgreSQL is a powerful, open source object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.

Supabase is an open source Firebase alternative. It provides all the backend services you need to build a product: a Postgres database, Authentication, instant APIs, Edge Functions, Realtime subscriptions, and Storage.`,
    status: "processed",
    uploadStatus: "uploaded",
    uploadPath: "test/path/web-dev-guide.pdf",
  },
]);

const testNotebookId = "test-notebook-chunking-123";

async function testVectorStoreWithChunking() {
  try {
    console.log("Testing vector storage with chunking");
    console.log(`Test content length: ${testContent.length} characters`);

    const storeResult = await StoreVectorsInSupabase(
      testContent,
      testNotebookId
    );
    console.log("Store result:", storeResult);
    console.log(`Total chunks created: ${storeResult.totalChunks}`);
    console.log(`Documents stored: ${storeResult.documentsStored}`);

    console.log("Waiting for indexing...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Testing vector search...");
    const searchResults = await SearchVectorsInNotebook(
      "machine learning and neural networks",
      testNotebookId,
      5
    );
    console.log("AI/ML search results:", {
      totalResults: searchResults.totalResults,
      filesFound: Object.keys(searchResults.groupedResults || {}).length,
    });
    const webSearchResults = await SearchVectorsInNotebook(
      "React Next.js web development",
      testNotebookId,
      5
    );
    console.log("Web dev search results:", {
      totalResults: webSearchResults.totalResults,
      filesFound: Object.keys(webSearchResults.groupedResults || {}).length,
    });

    if (searchResults.results.length > 0) {
      console.log("Sample search result:");
      console.log(
        "Content preview:",
        searchResults.results[0].content.substring(0, 200) + "..."
      );
      console.log("Metadata:", {
        filename: searchResults.results[0].metadata.filename,
        chunkIndex: searchResults.results[0].metadata.chunkIndex,
        totalChunks: searchResults.results[0].metadata.totalChunks,
        chunkSize: searchResults.results[0].metadata.chunkSize,
      });
    }

    console.log("All tests completed successfully");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

console.log("Starting vector store chunking tests");
testVectorStoreWithChunking();
