import { Monitor, X } from 'lucide-react';

const DisplayArea = ({ onClose }) => {
  return (
    <div className="h-full border-2 border-blue-500 rounded-md  flex flex-col">
      <div className="flex justify-between items-center bg-blue-100 px-4 py-2 border-b border-blue-300 ">
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <Monitor className="w-5 h-5" />
          DISPLAY AREA
        </div>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-blue-600" />
        </button>
      </div>
      <div className="flex-1  items-center justify-center p-4 bg-blue-50">
        <p className="text-blue-600">In the ever-evolving landscape of modern technology, the role of artificial intelligence (AI) has become increasingly prominent, influencing nearly every sector of human activity—from healthcare and education to agriculture and entertainment. As the global community continues to grapple with the implications of this technological revolution, it is crucial to reflect on the historical evolution of AI, its current applications, ethical challenges, and the direction it might take in the coming decades. Artificial intelligence, at its core, refers to machines or software that mimic human cognitive functions such as learning, reasoning, problem-solving, perception, and language understanding. Although the term "artificial intelligence" was officially coined in 1956 at the Dartmouth Conference, the concept of intelligent machines dates back to ancient myths and legends, where automatons and sentient beings were imagined by various civilizations. The idea gained momentum in the 20th century with the advent of computing technology, leading to groundbreaking developments in machine learning algorithms, neural networks, and natural language processing. </p>
        <br />
        <p className="text-blue-600">Today, AI is not just a theoretical field but a practical tool that powers many aspects of our daily lives. From the recommendation engines that suggest what we should watch next on Netflix, to the voice assistants that help us navigate our phones and homes, AI technologies are deeply integrated into modern society. In healthcare, AI algorithms are used to predict disease outbreaks, personalize treatment plans, and assist in diagnostics by analyzing complex medical data at speeds no human can match. In finance, AI-driven trading algorithms process vast amounts of market data to make split-second investment decisions, while fraud detection systems monitor transactions for suspicious activity. Education has also seen a transformation through AI, with intelligent tutoring systems providing personalized learning experiences, adaptive testing methods, and automated grading systems. In the agricultural sector, AI is used for precision farming, crop monitoring, and predictive analytics, helping to optimize yields and reduce environmental impact. Even in creative fields like music and art, AI-generated content is opening new avenues for collaboration and expression.</p>
        <br />
        <p className="text-blue-600">However, the rapid integration of AI into every facet of human life raises a host of ethical, legal, and social questions that must be carefully addressed. One of the primary concerns is the potential for job displacement, as machines and algorithms take over tasks traditionally performed by humans. While AI can enhance productivity and create new types of employment, it also risks widening socioeconomic inequalities if appropriate measures are not taken to reskill the workforce and ensure equitable access to opportunities. Another major concern revolves around data privacy and surveillance. AI systems often require vast amounts of personal data to function effectively, raising concerns about who controls this data, how it is used, and whether individuals have meaningful consent. Moreover, biases embedded in AI algorithms—stemming from biased training data or flawed assumptions by developers—can lead to discriminatory outcomes, particularly in high-stakes areas such as criminal justice, hiring, and lending. Ensuring transparency, accountability, and fairness in AI systems is not just a technical challenge but a moral imperative.</p>
        <br />
        <p className="text-blue-600">Governments and international organizations are beginning to respond to these challenges by proposing regulatory frameworks and ethical guidelines. The European Union, for example, has introduced the Artificial Intelligence Act, which seeks to categorize AI systems by risk level and impose varying degrees of regulation based on their potential impact. Similarly, UNESCO has adopted a Recommendation on the Ethics of Artificial Intelligence, emphasizing the need for human-centered values, inclusiveness, and sustainability. Despite these efforts, the global nature of AI development means that achieving a cohesive and enforceable set of standards remains a formidable task. It requires cooperation among nations, industries, researchers, and civil society to ensure that AI technologies are developed and deployed responsibly and for the common good.</p>
        <br />
        <p className="text-blue-600">Another important aspect to consider is the future trajectory of AI and how emerging innovations might reshape our understanding of intelligence, agency, and even consciousness. Advances in deep learning, quantum computing, brain-computer interfaces, and synthetic biology are pushing the boundaries of what AI systems can do. Some experts foresee the development of Artificial General Intelligence (AGI)—machines capable of performing any intellectual task that a human can do—which raises philosophical and existential questions about the nature of consciousness, free will, and what it means to be human. Others focus on the more immediate goal of achieving "explainable AI," where machines not only make decisions but also provide clear, understandable justifications for their choices. This is particularly critical in sectors like healthcare and criminal justice, where black-box algorithms can have life-altering consequences.</p>
        <br />
        <p className="text-blue-600"></p>
      </div>
    </div >
  );
};

export default DisplayArea;
