// MyAuthApp/Apps.js
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import Navigation from './navigation';

import './firebase/firebaseConfig';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <Navigation />
    </>
  );
}
