import React, { useState, useEffect } from 'react';

// Main App component for the Prompt Engineering Tester
const App = () => {
    // State to manage the currently selected prompting technique
    const [selectedTechnique, setSelectedTechnique] = useState('zero-shot');
    // State for the main user input prompt
    const [promptInput, setPromptInput] = useState('');
    // State for examples (used in few-shot prompting)
    const [examplesInput, setExamplesInput] = useState('');
    // State for system/role/context instruction
    const [systemInstruction, setSystemInstruction] = useState('');
    // State to store the LLM's response
    const [llmResponse, setLlmResponse] = useState('');
    // State to manage loading status during API calls for LLM response
    const [isLoading, setIsLoading] = useState(false);
    // State to manage loading status for prompt generation
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    // State to manage loading status for prompt refinement
    const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
    // State to manage error messages
    const [error, setError] = useState('');

    // Define the prompting techniques with their descriptions, relevant input fields,
    // static example prompts, and meta-prompt templates for auto-generation.
    const promptingTechniques = [
        {
            id: 'zero-shot',
            name: 'Zero-shot Prompting',
            description: 'The simplest prompt type, providing only a task description without examples.',
            inputs: [],
            examplePrompt: "Văn bản: 'Bộ phim này thật tuyệt vời, diễn xuất đỉnh cao!'.\nPhân loại cảm xúc của văn bản trên là gì (Tích cực, Tiêu cực, Trung lập)?",
            metaPromptTemplate: "Generate a simple zero-shot prompt for a classification task (e.g., sentiment analysis, topic classification). Provide only the main prompt text. Respond in Vietnamese JSON format with a 'promptInput' field."
        },
        {
            id: 'few-shot',
            name: 'Few-shot Prompting',
            description: 'Provides one (one-shot) or multiple (few-shot) examples in the prompt for the LLM to learn from. It is recommended to use at least 3-5 examples for few-shot.',
            inputs: ['examples'],
            examplePrompt: "Văn bản: 'The movie was quite boring and predictable.'\nSentiment:",
            exampleExamples: "Văn bản: 'Tôi không thích dịch vụ ở đây.'\nCảm xúc: Tiêu cực\n\nVăn bản: 'This product is okay.'\nCảm xúc: Trung lập\n\nVăn bản: 'A wonderful experience, I will definitely come back!'\nCảm xúc: Positive",
            metaPromptTemplate: "Generate a few-shot prompt for a named entity recognition task. Provide the main prompt text and 3-5 examples. Format the response as a JSON object with 'promptInput' and 'examplesInput' fields. Respond in Vietnamese."
        },
        {
            id: 'system-context-role',
            name: 'System, Context, and Role Prompting',
            description: 'Techniques that guide the LLM by focusing on different, potentially overlapping aspects. You can enter system, context, or role instructions here.',
            inputs: ['systemInstruction'],
            examplePrompt: "Summarize the 3 main impacts on the Southeast Asian region from the following article:\n\nClimate change is posing many challenges for the Southeast Asian region, including rising sea levels, increased frequency of extreme weather events such as storms and droughts, and negative impacts on food security. Countries in the region such as Vietnam, Thailand, and the Philippines are particularly vulnerable to these impacts, threatening the livelihoods of millions of people, especially those living in coastal and rural areas. Mitigation and adaptation efforts are essential.",
            exampleSystemInstruction: "Based on the following article on climate change, please",
            metaPromptTemplate: "Generate a role-playing prompt. Provide the main prompt text and a system instruction. Format the response as a JSON object with 'promptInput' and 'systemInstruction' fields. Respond in Vietnamese."
        },
        {
            id: 'chain-of-thought',
            name: 'Chain of Thought (CoT)',
            description: 'Improves the LLM\'s reasoning ability by asking it to generate intermediate reasoning steps before providing the final answer.',
            inputs: [],
            examplePrompt: "A farmer has 15 apples. He sells 7 and then picks 10 more. How many apples does he have in total? Think step by step.",
            metaPromptTemplate: "Generate a chain of thought prompt for a math word problem. Provide only the main prompt text, making sure it implicitly asks for step-by-step reasoning. Respond in Vietnamese JSON format with a 'promptInput' field."
        },
        {
            id: 'code-prompting',
            name: 'Code Prompting',
            description: 'Uses the LLM as a programming assistant. The LLM will generate or explain code.',
            inputs: [],
            examplePrompt: "Write a Python function named 'is_palindrome' that takes a string as input and returns True if the string is a palindrome (reads the same forwards and backward), otherwise False. Ignore spaces and case sensitivity.",
            metaPromptTemplate: "Generate a code generation prompt. Provide only the main prompt text for a common programming task (e.g., string manipulation, data structure, simple algorithm). Respond in Vietnamese JSON format with a 'promptInput' field."
        },
        {
            id: 'step-back',
            name: 'Step-back Prompting (Description Only)',
            description: 'Asks the LLM to consider a more general question first, then use that answer to solve the specific task, helping to activate background knowledge and improve reasoning. (Note: This technique is more complex to simulate direct interaction in this simple app, so only a description is provided).',
            inputs: [],
            isDescriptionOnly: true,
            examplePrompt: "Task: Design a database schema for a simple blog website including users, posts, and comments. (Step-back question: What are the fundamental principles for designing an efficient relational database? Use this answer to complete the task)."
        },
        {
            id: 'self-consistency',
            name: 'Self-consistency (Description Only)',
            description: 'Extends CoT by generating multiple reasoning paths (with high temperature) and selecting the most consistent answer through majority voting. Improves accuracy but is more costly. (Note: This technique is more complex to simulate direct interaction in this simple app, so only a description is provided).',
            inputs: [],
            isDescriptionOnly: true,
            examplePrompt: "Question: 'If 3 tailors can sew 3 shirts in 3 days, how many days will it take 6 tailors to sew 6 shirts?' (Note: This technique would require multiple LLM calls to get different reasoning paths and then vote)."
        },
        {
            id: 'tree-of-thoughts',
            name: 'Tree of Thoughts (ToT) (Description Only)',
            description: 'Generalizes CoT by allowing the LLM to explore multiple reasoning paths simultaneously in a tree structure, suitable for complex tasks. (Note: This technique is more complex to simulate direct interaction in this simple app, so only a description is provided).',
            inputs: [],
            isDescriptionOnly: true,
            examplePrompt: "Task: 'Write a 200-word essay about the future of space tourism.' (Note: This technique would require the model to explore and evaluate multiple ideas before generating the final answer)."
        },
        {
            id: 'react-prompting',
            name: 'ReAct (Reasoning and Acting) (Description Only)',
            description: 'A paradigm that enables LLMs to solve complex tasks by combining natural language reasoning with external tool use (e.g., search, code execution) in a thought-action-observation loop. (Note: This technique requires tool integration, so only a description is provided).',
            inputs: [],
            isDescriptionOnly: true,
            examplePrompt: "Who is the current president of France and their spouse? (Note: This technique requires the ability to use external search tools)."
        },
        {
            id: 'ape',
            name: 'Automatic Prompt Engineering (APE) (Description Only)',
            description: 'Automates the prompt writing process by using an LLM to generate candidate prompts, then evaluating and selecting the best one. (Note: This technique requires multiple LLM interactions, so only a description is provided).',
            inputs: [],
            isDescriptionOnly: true,
            examplePrompt: "Task: 'Summarize a scientific article.' (Note: This technique uses an LLM to automatically generate and evaluate prompts)."
        }
    ];

    // Effect to update prompt inputs when the selected technique changes
    useEffect(() => {
        const currentTech = promptingTechniques.find(tech => tech.id === selectedTechnique);
        if (currentTech) {
            setPromptInput(currentTech.examplePrompt || '');
            setExamplesInput(currentTech.exampleExamples || '');
            setSystemInstruction(currentTech.exampleSystemInstruction || '');
            setLlmResponse(''); // Clear previous LLM response when technique changes
            setError(''); // Clear previous error
        }
    }, [selectedTechnique]); // Re-run effect when selectedTechnique changes

    // Function to construct the final prompt based on the selected technique for sending to LLM
    const constructPrompt = () => {
        let finalPrompt = '';
        switch (selectedTechnique) {
            case 'zero-shot':
            case 'code-prompting':
                finalPrompt = promptInput;
                break;
            case 'few-shot':
                if (examplesInput) {
                    finalPrompt = `${examplesInput}\n\n---\n\n${promptInput}`; // Added extra newlines for clarity
                } else {
                    finalPrompt = promptInput; // Fallback if no examples are provided
                }
                break;
            case 'system-context-role':
                if (systemInstruction) {
                    finalPrompt = `${systemInstruction}\n\n${promptInput}`;
                } else {
                    finalPrompt = promptInput; // Fallback if no instruction is provided
                }
                break;
            case 'chain-of-thought':
                finalPrompt = `${promptInput} Hãy suy nghĩ từng bước một.`;
                break;
            default:
                finalPrompt = promptInput;
                break;
        }
        return finalPrompt;
    };

    // Handler for the main action: testing the constructed prompt against the LLM
    const handleTestPrompt = async () => {
        setError('');
        setLlmResponse('');
        setIsLoading(true);

        const currentTechnique = promptingTechniques.find(tech => tech.id === selectedTechnique);
        if (currentTechnique && currentTechnique.isDescriptionOnly) {
            setError('This is a description-only technique and cannot be tested directly in this app.');
            setIsLoading(false);
            return;
        }

        const finalPrompt = constructPrompt();

        if (!finalPrompt.trim()) {
            setError('Prompt cannot be empty. Please enter a prompt or generate one.');
            setIsLoading(false);
            return;
        }

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: finalPrompt }] });

        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will provide this at runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error.message || response.statusText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setLlmResponse(text);
            } else {
                setLlmResponse("No valid response received from the LLM. Please try again.");
            }
        } catch (err) {
            console.error("Error calling LLM API:", err);
            setError(`An error occurred: ${err.message}. Please check the console for more details.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for auto-generating prompt based on the selected technique
    const handleAutoGeneratePrompt = async () => {
        setError('');
        setLlmResponse('');
        setIsGeneratingPrompt(true);

        const currentTechnique = promptingTechniques.find(tech => tech.id === selectedTechnique);
        if (!currentTechnique || currentTechnique.isDescriptionOnly || !currentTechnique.metaPromptTemplate) {
            setError('Không thể tự động tạo lời nhắc cho kỹ thuật này hoặc không có mẫu meta-prompt.');
            setIsGeneratingPrompt(false);
            return;
        }

        const metaPrompt = currentTechnique.metaPromptTemplate;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: metaPrompt }] });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json", // Request JSON output for structured prompt generation
            }
        };
        const apiKey = ""; // Canvas will provide this at runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error.message || response.statusText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                try {
                    const generatedPromptData = JSON.parse(jsonText);
                    setPromptInput(generatedPromptData.promptInput || '');
                    setExamplesInput(generatedPromptData.examplesInput || '');
                    setSystemInstruction(generatedPromptData.systemInstruction || '');
                    setLlmResponse('Lời nhắc đã được tự động tạo thành công!');
                } catch (parseError) {
                    setError('Lỗi khi phân tích JSON từ phản hồi của LLM. Vui lòng thử lại.');
                    console.error("JSON parsing error:", parseError, "Raw LLM response:", jsonText);
                }
            } else {
                setLlmResponse("Không nhận được phản hồi hợp lệ từ LLM khi tạo lời nhắc. Vui lòng thử lại.");
            }
        } catch (err) {
            console.error("Error calling LLM API for prompt generation:", err);
            setError(`An error occurred during prompt generation: ${err.message}. Please check the console for more details.`);
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    // Handler for refining the current prompt using LLM
    const handleRefinePrompt = async () => {
        setError('');
        setLlmResponse('');
        setIsRefiningPrompt(true);

        const currentTechnique = promptingTechniques.find(tech => tech.id === selectedTechnique);
        if (currentTechnique && currentTechnique.isDescriptionOnly) {
            setError('Không thể tối ưu hóa lời nhắc cho kỹ thuật chỉ mô tả này.');
            setIsRefiningPrompt(false);
            return;
        }

        if (!promptInput.trim() && !examplesInput.trim() && !systemInstruction.trim()) {
            setError('Không có gì để tối ưu hóa. Vui lòng nhập lời nhắc chính, ví dụ hoặc hướng dẫn hệ thống.');
            setIsRefiningPrompt(false);
            return;
        }

        const originalPromptContent = `
            Kỹ thuật hiện tại: ${currentTechnique?.name}
            Lời nhắc chính: ${promptInput}
            ${examplesInput ? `Ví dụ (nếu có):\n${examplesInput}` : ''}
            ${systemInstruction ? `Hướng dẫn hệ thống/ngữ cảnh/vai trò (nếu có):\n${systemInstruction}` : ''}
        `.trim();

        const refineMetaPrompt = `
            Tôi có một lời nhắc sau đây. Hãy tối ưu hóa nó để đạt hiệu quả tốt nhất.
            Hãy đảm bảo nó rõ ràng, súc tích và tuân thủ các thực hành tốt nhất về kỹ thuật nhắc nhở.
            Trả về lời nhắc đã tối ưu hóa dưới dạng JSON với các trường 'promptInput', 'examplesInput', và 'systemInstruction'.
            Nếu một trường không liên quan hoặc trống trong lời nhắc gốc, hãy trả về nó dưới dạng chuỗi trống.
            Ngôn ngữ phản hồi phải là tiếng Việt.

            Lời nhắc gốc:
            """
            ${originalPromptContent}
            """
        `;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: refineMetaPrompt }] });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
            }
        };
        const apiKey = ""; // Canvas will provide this at runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Lỗi API: ${errorData.error.message || response.statusText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                try {
                    const optimizedPromptData = JSON.parse(jsonText);
                    setPromptInput(optimizedPromptData.promptInput || '');
                    setExamplesInput(optimizedPromptData.examplesInput || '');
                    setSystemInstruction(optimizedPromptData.systemInstruction || '');
                    setLlmResponse('Lời nhắc đã được tối ưu hóa thành công! ✨');
                } catch (parseError) {
                    setError('Lỗi khi phân tích JSON từ phản hồi của LLM khi tối ưu hóa. Vui lòng thử lại.');
                    console.error("Lỗi phân tích JSON:", parseError, "Phản hồi LLM thô:", jsonText);
                }
            } else {
                setLlmResponse("Không nhận được phản hồi hợp lệ từ LLM khi tối ưu hóa lời nhắc. Vui lòng thử lại.");
            }
        } catch (err) {
            console.error("Lỗi khi gọi API LLM để tối ưu hóa lời nhắc:", err);
            setError(`Đã xảy ra lỗi khi tối ưu hóa: ${err.message}. Vui lòng kiểm tra console để biết thêm chi tiết.`);
        } finally {
            setIsRefiningPrompt(false);
        }
    };


    // Get the description for the currently selected technique
    const currentTechnique = promptingTechniques.find(tech => tech.id === selectedTechnique);
    const currentTechniqueDescription = currentTechnique?.description;
    const canAutoGenerate = currentTechnique && !currentTechnique.isDescriptionOnly && currentTechnique.metaPromptTemplate;
    const canRefinePrompt = currentTechnique && !currentTechnique.isDescriptionOnly; // Can refine if not a description-only technique


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 p-6 font-sans antialiased">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8 space-y-8">
                <h1 className="text-4xl font-extrabold text-center text-purple-700 mb-8 tracking-tight">
                    Ứng dụng Kiểm tra Kỹ thuật Nhắc nhở
                </h1>

                {/* Technique Selection */}
                <div className="bg-blue-50 p-6 rounded-lg shadow-inner border border-blue-200">
                    <label htmlFor="technique-select" className="block text-lg font-semibold text-blue-800 mb-3">
                        Chọn Kỹ thuật Nhắc nhở:
                    </label>
                    <select
                        id="technique-select"
                        value={selectedTechnique}
                        onChange={(e) => setSelectedTechnique(e.target.value)}
                        className="w-full p-3 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out bg-white text-gray-800 shadow-sm"
                    >
                        {promptingTechniques.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                                {tech.name}
                            </option>
                        ))}
                    </select>
                    <p className="mt-4 text-sm text-blue-700 italic">
                        {currentTechniqueDescription}
                    </p>
                </div>

                {/* Dynamic Input Fields based on selected technique */}
                {(currentTechnique?.inputs.includes('examples')) && (
                    <div className="bg-yellow-50 p-6 rounded-lg shadow-inner border border-yellow-200">
                        <label htmlFor="examples-input" className="block text-lg font-semibold text-yellow-800 mb-3">
                            Ví dụ (cho Few-shot):
                        </label>
                        <textarea
                            id="examples-input"
                            className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-200 ease-in-out bg-white text-gray-800 shadow-sm min-h-[120px]"
                            value={examplesInput}
                            onChange={(e) => setExamplesInput(e.target.value)}
                            placeholder="Nhập các cặp ví dụ (ví dụ: 'Đầu vào: ...\nĐầu ra: ...'). Các ví dụ này sẽ được thêm vào trước lời nhắc chính."
                        ></textarea>
                        <p className="mt-2 text-sm text-yellow-700">Example: `Text: 'I love dogs.'\nSentiment: Positive`</p>
                    </div>
                )}

                {(currentTechnique?.inputs.includes('systemInstruction')) && (
                    <div className="bg-green-50 p-6 rounded-lg shadow-inner border border-green-200">
                        <label htmlFor="system-instruction-input" className="block text-lg font-semibold text-green-800 mb-3">
                            Hướng dẫn Hệ thống/Ngữ cảnh/Vai trò:
                        </label>
                        <textarea
                            id="system-instruction-input"
                            className="w-full p-3 border border-green-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200 ease-in-out bg-white text-gray-800 shadow-sm min-h-[100px]"
                            value={systemInstruction}
                            onChange={(e) => setSystemInstruction(e.target.value)}
                            placeholder="Nhập hướng dẫn cho LLM (ví dụ: 'Bạn là một chuyên gia ẩm thực.', 'Trả lời dưới dạng JSON.'). Hướng dẫn này sẽ được thêm vào trước lời nhắc chính."
                        ></textarea>
                    </div>
                )}

                {/* Main Prompt Input */}
                {!currentTechnique?.isDescriptionOnly && (
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
                        <label htmlFor="prompt-input" className="block text-lg font-semibold text-gray-800 mb-3">
                            Lời nhắc chính của bạn:
                        </label>
                        <textarea
                            id="prompt-input"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 ease-in-out bg-white text-gray-800 shadow-sm min-h-[150px]"
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            placeholder="Enter your main prompt here..."
                        ></textarea>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleTestPrompt}
                        disabled={isLoading || isGeneratingPrompt || isRefiningPrompt || currentTechnique?.isDescriptionOnly}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg justify-center items-center"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang tạo phản hồi...
                            </span>
                        ) : (
                            'Kiểm tra Lời nhắc'
                        )}
                    </button>
                    <button
                        onClick={handleAutoGeneratePrompt}
                        disabled={!canAutoGenerate || isLoading || isGeneratingPrompt || isRefiningPrompt}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg justify-center items-center"
                    >
                        {isGeneratingPrompt ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang tạo lời nhắc...
                            </span>
                        ) : (
                            'Tự động tạo Lời nhắc ✨'
                        )}
                    </button>
                    <button
                        onClick={handleRefinePrompt}
                        disabled={!canRefinePrompt || isLoading || isGeneratingPrompt || isRefiningPrompt}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg justify-center items-center"
                    >
                        {isRefiningPrompt ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang tối ưu hóa...
                            </span>
                        ) : (
                            'Tối ưu hóa Lời nhắc ✨'
                        )}
                    </button>
                </div>

                {/* Error Message Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
                        <strong className="font-bold">Lỗi:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                {/* LLM Response Display */}
                {llmResponse && (
                    <div className="bg-gray-100 p-6 rounded-lg shadow-inner border border-gray-300">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Phản hồi của LLM:</h2>
                        <pre className="whitespace-pre-wrap font-mono text-gray-800 bg-gray-50 p-4 rounded-md overflow-x-auto border border-gray-200">
                            {llmResponse}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
