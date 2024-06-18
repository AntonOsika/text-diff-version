import React, { useState, useEffect } from "react";
import { Container, Textarea, VStack, Button, Box, Text } from "@chakra-ui/react";
import { diffChars } from "diff";

const Index = () => {
  const [text, setText] = useState("");
  const [versions, setVersions] = useState([]);
  const [diffText, setDiffText] = useState([]);

  useEffect(() => {
    const storedVersions = JSON.parse(localStorage.getItem("versions")) || [];
    setVersions(storedVersions);
    if (storedVersions.length > 0) {
      setText(storedVersions[storedVersions.length - 1]);
    }
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

  return (
    <Container centerContent maxW="container.xl" height="100vh" display="flex" flexDirection="row" justifyContent="center" alignItems="center">
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type here..."
          size="lg"
          height="70%"
        />
        <Button mt={4} colorScheme="teal" onClick={handleAccept}>
          Accept
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
    </Container>
  );
};

export default Index;