"""
Velero Dashboard Backend - S3 Storage Validation Service

S3 스토리지 연결 테스트 및 검증
"""

import boto3
from botocore.exceptions import ClientError, BotoCoreError
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


class S3ValidationService:
    """S3 storage validation service"""
    
    @staticmethod
    def validate_storage(
        s3_url: str,
        bucket: str,
        region: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        prefix: Optional[str] = None
    ) -> Tuple[bool, str, Optional[int], Optional[str]]:
        """
        Validate S3 storage connection
        
        Returns:
            (success, message, object_count, latest_backup)
        """
        try:
            # Create S3 client
            s3_config = {
                "endpoint_url": s3_url,
            }
            
            if region:
                s3_config["region_name"] = region
            
            if access_key and secret_key:
                s3_config["aws_access_key_id"] = access_key
                s3_config["aws_secret_access_key"] = secret_key
            
            s3_client = boto3.client("s3", **s3_config)
            
            # Test 1: Check if bucket exists and is accessible
            try:
                s3_client.head_bucket(Bucket=bucket)
                logger.info(f"Bucket {bucket} is accessible")
            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code", "Unknown")
                if error_code == "404":
                    return False, f"Bucket '{bucket}' not found", None, None
                elif error_code == "403":
                    return False, f"Access denied to bucket '{bucket}'", None, None
                else:
                    return False, f"Bucket check failed: {error_code}", None, None
            
            # Test 2: List objects (with prefix if provided)
            list_params = {
                "Bucket": bucket,
                "MaxKeys": 100
            }
            if prefix:
                list_params["Prefix"] = prefix
            
            try:
                response = s3_client.list_objects_v2(**list_params)
                object_count = response.get("KeyCount", 0)
                
                # Find latest backup object
                latest_backup = None
                if "Contents" in response and response["Contents"]:
                    # Sort by last modified (descending)
                    sorted_objects = sorted(
                        response["Contents"],
                        key=lambda x: x.get("LastModified", ""),
                        reverse=True
                    )
                    if sorted_objects:
                        latest_backup = sorted_objects[0].get("Key", "")
                
                logger.info(
                    f"Storage validation successful: {object_count} objects found"
                )
                
                return (
                    True,
                    f"Connection successful! Found {object_count} objects.",
                    object_count,
                    latest_backup
                )
            
            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code", "Unknown")
                return (
                    False,
                    f"Failed to list objects: {error_code}",
                    None,
                    None
                )
        
        except BotoCoreError as e:
            logger.error(f"Boto3 error during S3 validation: {e}")
            return False, f"Connection error: {str(e)}", None, None
        
        except Exception as e:
            logger.error(f"Unexpected error during S3 validation: {e}")
            return False, f"Validation failed: {str(e)}", None, None


# Global service instance
s3_validation_service = S3ValidationService()
