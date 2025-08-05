'use client'

import { useState, useEffect, useRef } from "react";
import { firestore, auth, googleProvider } from "@/firebase";
import { Box, Typography, Stack, TextField, Modal, Button } from '@mui/material'
import { collection, deleteDoc, getDocs, query, setDoc, getDoc, doc } from "firebase/firestore";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import OpenAI from 'openai';

export default function Home() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState('');

  // OpenAI
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        updateInventory(currentUser.uid);
      } else {
        setInventory([]);
      }
    });
    return unsubscribe;
  }, []);

  const updateInventory = async (uid) => {
    try {
      const inventoryQuery = collection(firestore, 'users', uid, 'inventory');
      const docs = await getDocs(inventoryQuery);

      const inventoryList = [];
      docs.forEach(doc => {
        inventoryList.push({ name: doc.id, ...doc.data() });
      });

      console.log("Fetched Inventory:", inventoryList);
      setInventory(inventoryList);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  }

  const addItem = async (item) => {
    if (!user) return;
    const uid = user.uid;
    const itemRef = doc(firestore, 'users', uid, 'inventory', item.toLowerCase());
    const itemSnap = await getDoc(itemRef);

    if (itemSnap.exists()) {
      const { quantity } = itemSnap.data();
      await setDoc(itemRef, { quantity: quantity + 1 });
    } else {
      await setDoc(itemRef, { quantity: 1 });
    }

    await updateInventory(uid); // Refresh UI
  };


  const removeItem = async (item) => {
    if (!user) return;
    const uid = user.uid;
    const itemRef = doc(firestore, 'users', uid, 'inventory', item.toLowerCase());
    const itemSnap = await getDoc(itemRef);

    if (itemSnap.exists()) {
      const { quantity } = itemSnap.data();
      if (quantity > 1) {
        await setDoc(itemRef, { quantity: quantity - 1 });
      } else {
        await deleteDoc(itemRef);
      }
    }

    await updateInventory(uid); // Refresh UI
  };


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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Look at the image and return only a comma-separated list of all general product types you see in the shopping cart. Do not include brand names, descriptions, or any extra text. Just output the list like this: apple, banana, chips, water bottle.Do not include phrases like ‘I see’, ‘In the image’, or anything else — just the list.",
              },
              {
                type: "image_url",
                image_url: {
                  "url": imageDataUrl,
                  "detail": "low"
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      });
      handleCameraClose();
      // const result = await response.json();
      // console.log('Analysis result:', result);
      const content = response.choices[0].message.content;
      console.log("Detected items string:", content);

      const items = content.split(',').map(item => item.trim().toLowerCase());

      for (const item of items) {
        await addItem(item);
      }
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
    console.log("Calling updateInventory...");
    updateInventory();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged listener will update user
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleEmailLogin = async () => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleRegister = async () => {
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={2} px={4}>
        <Typography variant="h4">{authMode === 'login' ? 'Login' : 'Register'}</Typography>
        <TextField
          label="Email"
          variant="outlined"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
        />
        {authError && <Typography color="error">{authError}</Typography>}
        <Stack direction="row" spacing={2} mt={2} width="100%">
          {authMode === 'login' ? (
            <>
              <Button variant="contained" fullWidth onClick={handleEmailLogin}>Login</Button>
              <Button variant="outlined" fullWidth onClick={() => setAuthMode('register')}>Switch to Register</Button>
            </>
          ) : (
            <>
              <Button variant="contained" fullWidth onClick={handleRegister}>Register</Button>
              <Button variant="outlined" fullWidth onClick={() => setAuthMode('login')}>Switch to Login</Button>
            </>
          )}
        </Stack>
        <Typography variant="body1" mt={2}>OR</Typography>
        <Button variant="contained" fullWidth onClick={handleGoogleLogin} sx={{ mt: 1 }}>
          Sign in with Google
        </Button>
      </Box>
    );
  }

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={2} p={2}>
      <Typography variant="h3" color="#333" textAlign="center">
        Inventory List for {user.email.split('@')[0]}
      </Typography>

      <Button variant="outlined" color="error" onClick={handleLogout} sx={{ alignSelf: 'flex-end' }}>
        Logout
      </Button>

      <Stack direction="row" spacing={2}>
        <Modal open={open} onClose={handleClose}>
          <Box position="absolute" top="50%" left="50%" width={400} bgcolor="white" border="2px solid #000" boxShadow={24} p={4} display="flex" flexDirection="column" gap={3} sx={{ transform: "translate(-50%,-50%)" }}>
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

        <Button variant="contained" onClick={() => { handleOpen() }}>
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
            <Stack spacing={2}>
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
                    <Button variant="contained" color="primary" onClick={submitImage} >Add Item</Button>
                  </Stack>
                </>
              )}
              <Button variant="outlined" color="secondary" onClick={handleCameraClose} sx={{ mt: 2 }}>
                Close
              </Button>
            </Stack>
          </Box>
        </Modal>
      </Stack>

      <Box border="1px solid #333" maxWidth={800} width="100%">
        <Box width="100%" height="50px" bgcolor="#ADD8E6" display="flex" alignItems="center" justifyContent="space-around">
          <Typography variant="h6" color="#333" flex={2} textAlign="center">Items</Typography>
          <Typography variant="h6" color="#333" flex={1} textAlign="center">Quantity</Typography>
          <Typography variant="h6" color="#333" flex={2} textAlign="center">Actions</Typography>
        </Box>
        <Stack width="100%" maxHeight={300} spacing={2} overflow="auto" p={1}>
          {inventory.map(({ name, quantity }) => (
            <Box key={name} width="100%" minHeight="50px" display="flex" alignItems="center" justifyContent="space-around" bgcolor="#f0f0f0" padding={1}>
              <Typography variant="body1" color="#333" flex={2} textAlign="center" sx={{ userSelect: 'none' }}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="body1" color="#333" flex={1} textAlign="center" sx={{ userSelect: 'none' }}>
                {quantity}
              </Typography>
              <Stack direction="row" spacing={1} flex={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    addItem(name);
                  }}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    removeItem(name);
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