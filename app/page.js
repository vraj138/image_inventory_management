'use client'

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { firestore } from "@/firebase";
import { Box, Typography, Stack, TextField, Modal, Button } from '@mui/material'
import { collection, deleteDoc, getDocs, query, setDoc, getDoc, doc } from "firebase/firestore";
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState('');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // const genAI = new GoogleGenerativeAI();

  const handleCameraAccess = async () => {
    try {
      // Request access to the camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Set the video element's source to the camera stream
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  }

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setInventory(inventoryList)
  }

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }

    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity == 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }

    await updateInventory()
  }

  const captureImage = () => {
    setImageDataUrl('');
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setImageDataUrl(dataUrl);
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = 'captured-image.png';
    a.click();
  };


  const submitImage = async () => {
    if (!imageDataUrl) return;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is in this image?" },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl, // Pass the image URL directly from the client-side
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      });
      const result = await response.json();
      console.log('Analysis result:', result);
    } catch (error) {
      console.error('Error submitting image:', error);
    }

  };

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleCameraOpen = () => {
    setOpenCamera(true);
    handleCameraAccess();
  }

  const handleCameraClose = () => {
    setOpenCamera(false);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null; // Clear the video element's source
    }
    setImageDataUrl('');
  };

  useEffect(() => {
    updateInventory()
  }, [])

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={2}>
      <Typography variant="h3" color="#333" textAlign="center">
        Inventory List
      </Typography>
      <Stack direction="row" spacing={2}>
        <Modal open={open} onClose={handleClose}>
          <Box position="absolute" top="50%" left="50%" width={400} bgcolor="white" boder="2px solid #000" boxShadow={24} p={4} display="flex" flexDirection="column" gap={3} sx={{ transform: "translate(-50%,-50%)" }}>
            <Typography variant="h6">Add Item</Typography>
            <Stack width="100%" direction="row" spacing={2}>
              <TextField variant="outlined" fullWidth value={itemName} onChange={(e) => { setItemName(e.target.value) }} />
              <Button
                variant="outlined"
                onClick={() => {
                  addItem(itemName)
                  setItemName('')
                  handleClose()
                }}>
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Button
          variant="contained"
          onClick={() => {
            handleOpen()
          }}
        >
          Add New Item
        </Button>
        <Button variant="contained" color="primary" onClick={handleCameraOpen}>
          Open Camera
        </Button>
        <Modal
          open={openCamera}
          onClose={handleCameraClose}
          aria-labelledby="camera-modal-title"
          aria-describedby="camera-modal-description"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              border: '2px solid #000',
              boxShadow: 24,
              p: 4,
            }}
          >
            <h2 id="camera-modal-title">Camera Feed</h2>
            <video ref={videoRef} autoPlay style={{ width: '100%' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} width={400} height={300} />
            <Button variant="outlined" color="secondary" onClick={captureImage} sx={{ mt: 2 }}>
              Capture Image
            </Button>
            {imageDataUrl && (
              <>
                <img src={imageDataUrl} alt="Captured" style={{ width: '100%', marginTop: '10px' }} />
                <Stack width="100%" direction="row" spacing={2}>
                  <Button variant="contained" color="primary" onClick={downloadImage} sx={{ mt: 2 }}>
                    Download Image
                  </Button>
                  <Button variant="contained" color="primary" onClick={submitImage}>Recognize Image</Button>
                </Stack>
              </>
            )}
            <Button variant="outlined" color="secondary" onClick={handleCameraClose} sx={{ mt: 2 }}>
              Close
            </Button>
          </Box>
        </Modal>
      </Stack>
      <Box border="1px solid #333">
        <Box width="800px" height="100px" bgcolor="#ADD8E6" display="flex" alignItems="center" justifyContent="center">
          <Stack direction="row" spacing={30}>
            <Typography varient="h2" color="#333">
              Items
            </Typography>
            <Typography varient="h2" color="#333">
              Quantity
            </Typography>
            <Typography varient="h2" color="#333">
              Actions
            </Typography>
          </Stack>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow="auto">
          {inventory.map(({ name, quantity }) => (
            <Box key={name} width="100%" minHeight="150px" display="flex" alignItems="center" justifyContent="space-between" bgcolor="#f0f0f0" padding={5}>
              <Typography variant="h3" color="#333" textAlign="center">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h3" color="#333" textAlign="center">
                {quantity}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => {
                    addItem(name)
                  }}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    removeItem(name)
                  }}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
} 
