#!/usr/bin/env python3
import requests
import json
import os
import sys
import unittest
from datetime import datetime

# Get the backend URL from the frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.strip().split('=')[1].strip('"\'')
    except Exception as e:
        print(f"Error reading frontend/.env: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("ERROR: Could not determine backend URL from frontend/.env")
    sys.exit(1)

API_URL = f"{BACKEND_URL}/api"
print(f"Using backend API URL: {API_URL}")

class BackendAPITest(unittest.TestCase):
    """Test the backend API endpoints"""
    
    def test_root_endpoint(self):
        """Test the root API endpoint"""
        response = requests.get(f"{API_URL}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Hello World")
        print("✅ Root endpoint test passed")
    
    def test_status_endpoint_post(self):
        """Test posting to the status endpoint"""
        payload = {"client_name": "test_client"}
        response = requests.post(f"{API_URL}/status", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["client_name"], "test_client")
        self.assertTrue("id" in data)
        self.assertTrue("timestamp" in data)
        print("✅ Status POST endpoint test passed")
    
    def test_status_endpoint_get(self):
        """Test getting from the status endpoint"""
        response = requests.get(f"{API_URL}/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(isinstance(data, list))
        if len(data) > 0:
            self.assertTrue("client_name" in data[0])
            self.assertTrue("id" in data[0])
            self.assertTrue("timestamp" in data[0])
        print("✅ Status GET endpoint test passed")

    def test_settings_modal_note(self):
        """Note about Settings Modal testing"""
        print("\n⚠️ NOTE: The Settings Modal functionality is a frontend feature that cannot be tested through backend API testing.")
        print("The Settings Modal uses localStorage for persistence and doesn't interact with the backend.")
        print("To test the Settings Modal closing functionality, frontend UI testing would be required using tools like Selenium or Playwright.")
        print("Based on the code review, the Settings Modal closing functionality has been implemented with:")
        print("1. X button handler (handleCloseClick)")
        print("2. Overlay click handler (handleOverlayClick with e.target === e.currentTarget check)")
        print("3. Escape key handler (useEffect with keydown event listener)")
        print("4. Dark mode styling throughout the modal")
        print("5. Language switching support with key={i18n.language} prop for re-rendering")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
