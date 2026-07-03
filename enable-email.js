import fs from 'fs';

async function main() {
  try {
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
    const projectId = config.projectId;
    console.log('Project ID:', projectId);

    console.log('Fetching token from metadata...');
    const tokenRes = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    if (!tokenRes.ok) {
      throw new Error(`Token fetch failed: ${tokenRes.status} ${tokenRes.statusText}`);
    }
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    console.log('Token length:', token.length);

    // Step 1: Enable Identity Toolkit API
    console.log('Enabling identitytoolkit.googleapis.com...');
    const enableUrl = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/identitytoolkit.googleapis.com:enable`;
    const enableRes = await fetch(enableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Goog-User-Project': projectId
      },
      body: '{}'
    });

    const enableBody = await enableRes.text();
    console.log('Enable API Status:', enableRes.status);
    console.log('Enable API Response:', enableBody);

    if (!enableRes.ok) {
      console.warn('Could not enable API via serviceusage, attempting patch directly just in case...');
    } else {
      console.log('Successfully requested API enablement, waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Step 2: Patch identity toolkit config
    console.log('Patching identity toolkit config...');
    const url = `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config?updateMask=signIn.email`;
    const patchRes = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Goog-User-Project': projectId
      },
      body: JSON.stringify({
        signIn: {
          email: {
            enabled: true,
            passwordRequired: true
          }
        }
      })
    });

    const resBody = await patchRes.text();
    console.log('Patch Response Status:', patchRes.status);
    console.log('Patch Response Body:', resBody);
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
