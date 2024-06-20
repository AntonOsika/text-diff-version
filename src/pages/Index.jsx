import React, { useState, useEffect, useRef } from "react";
import { Container, Textarea, VStack, Button, Box, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Input, useDisclosure } from "@chakra-ui/react";
import { diffChars } from "diff";
import { Configuration, OpenAIApi } from "openai";
import { marked } from "marked";

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
  const [selectionRange, setSelectionRange] = useState(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (textAreaRef.current && !textAreaRef.current.contains(event.target) && !event.target.closest('.chat-box')) {
        setShowChatBox(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selectedText);
      setSelectionRange(range); // Store the selection range

      setChatBoxPosition({ x: rect.right + window.scrollX + 10, y: rect.bottom + window.scrollY + 10 });
      setShowChatBox(true);
    } else if (!e.target.closest('.chat-box')) {
      setShowChatBox(false);
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleQuerySubmit = async () => {
    if (!apiKey) {
      onOpen();
      return;
    }

    const configuration = new Configuration({
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);
    delete configuration.baseOptions.headers['User-Agent'];

    const prompt = `
      you will get text in a document and a selection of the document.
      you must only answer with the text that exactly replaces the content inside the <selection></selection> tag. Nothing else. No XML tags.

      <document>${text}<document>
      <selection>${selectedText}<selection>
      <instructions>${query}<instructions>
    `;

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
      });

      const newText = text.replace(selectedText, response.data.choices[0].message.content.trim());
      setText(newText);
      setShowChatBox(false);

      // Remember the selection and the response
      const newVersions = [...versions, newText];
      setVersions(newVersions);
      localStorage.setItem("versions", JSON.stringify(newVersions));

      // Restore the selection range
      if (selectionRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(selectionRange);
      }
    } catch (error) {
      console.error("Error fetching data from OpenAI:", error);
    }
  };

  const handleQueryBoxClick = (e) => {
    e.stopPropagation();
  };

  const renderDiffAsMarkdown = (diff) => {
    return diff.map((part, index) => {
      const html = marked(part.value);
      const color = part.added ? "green.500" : part.removed ? "red.500" : "black";
      return (
        <Text
          key={index}
          as="span"
          color={color}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  return (
    <Container centerContent maxW="container.xl" height="100vh" display="flex" flexDirection="row" justifyContent="space-between" alignItems="stretch" p={0} m={0}>
      <Box width="10%" height="100%" borderWidth="1px" borderRadius="lg" overflow="hidden" p={2}>
        <VStack spacing={2} align="stretch">
          {versions.map((version, index) => (
            <Text key={index} fontSize="sm" isTruncated>
              Version {index + 1}
            </Text>
          ))}
          <Button mt={2} colorScheme="teal" onClick={handleAccept}>
            Accept
          </Button>
          <Button mt={2} colorScheme="blue" onClick={onOpen}>
            Settings
          </Button>
        </VStack>
      </Box>
      <Box width="45%" height="100%" borderWidth="1px" borderRadius="lg" overflow="hidden" p={2} ml={2}>
        <Textarea
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onMouseUp={handleTextSelect}
          placeholder="Type here..."
          size="lg"
          height="100%"
        />
      </Box>
      <Box width="45%" height="100%" borderWidth="1px" borderRadius="lg" overflow="hidden" p={2} ml={2}>
        <Box height="100%" overflowY="scroll">
          {renderDiffAsMarkdown(diffText)}
        </Box>
      </Box>

      {showChatBox && (
        <Box className="chat-box" position="absolute" top={`${chatBoxPosition.y}px`} left={`${chatBoxPosition.x}px`} bg="white" p={4} borderWidth="1px" borderRadius="lg" zIndex={1000} onClick={handleQueryBoxClick}>
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