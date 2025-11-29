# AWS S3 Bucket Configuration Guide

This guide explains the required AWS S3 bucket configuration for the FindConstructionBids platform.

## Required Configuration

Your S3 bucket needs two key configurations to work with this application:

### 1. CORS Configuration

The bucket must allow cross-origin requests from your frontend. Add this CORS policy to your bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://construction-bid-hub-mechanizedinc.replit.app",
      "https://*.replit.dev",
      "http://localhost:5000",
      "https://*.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**How to add CORS policy:**
1. Go to AWS S3 Console
2. Select your bucket (`findconstructionbids-dev`)
3. Go to "Permissions" tab
4. Scroll to "Cross-origin resource sharing (CORS)"
5. Click "Edit" and paste the above JSON
6. Click "Save changes"

### 2. Bucket Policy for Public Read Access (Optional)

For optimal performance, add a bucket policy to allow public read access to uploaded files:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::findconstructionbids-dev/*"
    }
  ]
}
```

**How to add bucket policy:**
1. Go to AWS S3 Console
2. Select your bucket
3. Go to "Permissions" tab
4. Scroll to "Bucket policy"
5. Click "Edit" and paste the above JSON
6. Click "Save changes"

**Note:** If you don't add this policy, the application will still work—it will use presigned URLs for downloads (which are secure but slightly slower).

### 3. Block Public Access Settings

Ensure "Block all public access" is **OFF** if you want to use the public read bucket policy:

1. Go to "Permissions" tab
2. Under "Block public access (bucket settings)"
3. Click "Edit"
4. Uncheck "Block all public access"
5. Uncheck all individual settings
6. Click "Save changes"
7. Type "confirm" when prompted

**Important:** If you keep "Block public access" ON, you MUST use presigned download URLs (the app will handle this automatically).

### 4. IAM User Permissions

Your AWS IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::findconstructionbids-dev",
        "arn:aws:s3:::findconstructionbids-dev/*"
      ]
    }
  ]
}
```

## Troubleshooting

### Upload fails with "Forbidden" error

**Possible causes:**
1. CORS is not configured correctly
2. IAM user doesn't have `s3:PutObject` permission
3. Bucket has additional restrictions (VPC endpoints, IP restrictions, etc.)

**Solutions:**
1. Verify CORS configuration includes your domain
2. Check IAM user permissions
3. Review bucket policy for any Deny statements
4. Check if bucket is using AWS KMS encryption (presigned URLs need additional permissions)

### Files upload but can't be downloaded

**Possible causes:**
1. Bucket policy for public read is not set
2. Block Public Access is enabled
3. AWS credentials are not configured for presigned downloads

**Solutions:**
1. Add the bucket policy shown above
2. Disable Block Public Access
3. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets are set

## Current Configuration Status

- **Bucket Name:** `findconstructionbids-dev`
- **Region:** `us-east-1`
- **ACLs:** Disabled (modern configuration)
- **Upload Method:** Presigned URLs
- **Download Method:** Hybrid (presigned URLs with public fallback)

## Testing

After configuring, test with:

1. Upload a document to an RFP
2. Check browser console for errors
3. Try downloading the document
4. Verify the file URL is accessible

If you see CORS errors in the browser console, double-check your CORS configuration matches the example above.
