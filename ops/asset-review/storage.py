"""Bounded encrypted-object transport to the existing Backblaze account. No plaintext storage."""
import os,sys,json,re,base64
import boto3
from botocore.config import Config
def main():
 b=json.load(sys.stdin);key=b.get('key','')
 if not re.fullmatch(r'private/asset-review/[0-9a-f-]{36}/[0-9a-f-]{36}\.enc',key):raise ValueError('Invalid object key')
 client=boto3.client('s3',endpoint_url=os.environ['ASSET_B2_ENDPOINT'],aws_access_key_id=os.environ['ASSET_B2_KEY_ID'],aws_secret_access_key=os.environ['ASSET_B2_APPLICATION_KEY'],config=Config(connect_timeout=8,read_timeout=30,retries={'max_attempts':2}))
 bucket=os.environ['ASSET_B2_BUCKET']
 if b['action']=='put':
  data=base64.b64decode(b['data'],validate=True)
  if len(data)>10_500_000:raise ValueError('Object too large')
  client.put_object(Bucket=bucket,Key=key,Body=data,ContentType='application/octet-stream');print(json.dumps({'ok':True}))
 elif b['action']=='get':
  data=client.get_object(Bucket=bucket,Key=key)['Body'].read(10_500_001)
  if len(data)>10_500_000:raise ValueError('Object too large')
  print(json.dumps({'data':base64.b64encode(data).decode()}))
 elif b['action']=='delete':
  client.delete_object(Bucket=bucket,Key=key);print(json.dumps({'ok':True}))
 else:raise ValueError('Unsupported storage action')
if __name__=='__main__':
 try:main()
 except Exception:print('{"error":"Private storage unavailable"}');sys.exit(1)
