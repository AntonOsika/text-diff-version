import React, { useState, useEffect, useRef } from "react";
import { Container, Textarea, VStack, Button, Box, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Input, useDisclosure } from "@chakra-ui/react";
import { diffChars } from "diff";
import { Configuration, OpenAIApi } from "openai";

const Index = () => {
  const [text, setText] = useState("");
  const [versions, setVersions] = useState([]);
  const [diffText, setDiffText] = useState([]);
  const [apiKey, setApiKey] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedText, setSelectedText] = useState("");
  const [showChatBox, setShowChatBox] = useState(false);
  const [chatBoxPosition, setChatBoxPosition] = useState({ x: 0, y: 0 });
  const [query, setQuery] = useState("");
  const textAreaRef = useRef(null);

  useEffect(() => {
    const storedVersions = JSON.parse(localStorage.getItem("versions")) || [];
    setVersions(storedVersions);
    if (storedVersions.length > 0) {
      setText(storedVersions[storedVersions.length - 1]);
    }
    const storedApiKey = localStorage.getItem("apiKey") || "";
    setApiKey(storedApiKey);
  }, []);

  useEffect(() => {
    if (versions.length > 0) {
      const oldText = versions[versions.length - 1];
      const diff = diffChars(oldText, text);
      setDiffText(diff);
    }
  }, [text, versions]);

  const handleAccept = () => {
    const newVersions = [...versions, text];
    setVersions(newVersions);
    localStorage.setItem("versions", JSON.stringify(newVersions));
  };

  const handleSaveApiKey = () => {
    localStorage.setItem("apiKey", apiKey);
    onClose();
  };

  const handleTextSelect = (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      const { x, y } = selection.getRangeAt(0).getBoundingClientRect();
      setSelectedText(selectedText);
      setChatBoxPosition({ x, y });
      setShowChatBox(true);
    } else {
      setShowChatBox(false);
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleQuerySubmit = async () => {
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `
      you will get text in a document and a selection of the document.
      you must only answer with the text that exactly replaces the content inside the <selection></selection> tag. Nothing else. No XML tags.

      <document>${text}<document>
      <selection>${selectedText}<selection>
    `;

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
      });

      const newText = text.replace(selectedText, response.data.choices[0].message.content);
      setText(newText);
      setShowChatBox(false);
    } catch (error) {
      console.error("Error fetching data from OpenAI:", error);
    }
  };

  return (
    <Container centerContent maxW="container.xl" height="100vh" display="flex" flexDirection="row" justifyContent="center" alignItems="center" onMouseUp={handleTextSelect}>
      <Box width="20%" height="80vh" borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}>
        <VStack spacing={4} align="stretch">
          {versions.map((version, index) => (
            <Text key={index} fontSize="sm" isTruncated>
              Version {index + 1}
            </Text>
          ))}
        </VStack>
      </Box>
      <Box width="70%" height="80vh" borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} ml={4}>
        <Textarea
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type here..."
          size="lg"
          height="70%"
        />
        <Button mt={4} colorScheme="teal" onClick={handleAccept}>
          Accept
        </Button>
        <Button mt={4} ml={4} colorScheme="blue" onClick={onOpen}>
          Settings
        </Button>
        <Box mt={4} height="20vh" overflowY="scroll">
          {diffText.map((part, index) => (
            <Text
              key={index}
              as="span"
              color={part.added ? "green.500" : part.removed ? "red.500" : "black"}
            >
              {part.value}
            </Text>
          ))}
        </Box>
      </Box>

      {showChatBox && (
        <Box position="absolute" top={`${chatBoxPosition.y}px`} left={`${chatBoxPosition.x}px`} bg="white" p={4} borderWidth="1px" borderRadius="lg" zIndex={1000}>
          <Textarea
            value={query}
            onChange={handleQueryChange}
            placeholder="Ask for changes..."
            size="sm"
          />
          <Button mt={2} colorScheme="teal" onClick={handleQuerySubmit}>
            Submit
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSaveApiKey}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Index;