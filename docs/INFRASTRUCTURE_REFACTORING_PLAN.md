# Infrastructure Module Refactoring Plan

## 🎯 Objective
Refactor Cache, Redis, RabbitMQ, and Upload modules to match the enterprise-grade standards we established in Auth & Personnel Management.

---

## 📊 Current State Assessment

### ✅ What's Good
1. **RedisService**: Clean, well-structured, good error handling
2. **CacheService**: Multi-layer caching with statistics
3. **RabbitMQService**: Event-driven architecture
4. **CloudinaryService**: Basic upload functionality

### ⚠️ What Needs Improvement

#### 1. **Missing DTOs & Validation**
- Upload service has no DTOs
- No file validation (size, type, dimensions)
- No request/response DTOs

#### 2. **Missing Business Logic Layer**
- Direct service usage without domain logic
- No upload policies (max size per user type)
- No image optimization pipeline

#### 3. **Missing Error Handling**
- Generic InternalServerErrorException
- No custom exceptions
- No error codes

#### 4. **Missing Types & Interfaces**
- Upload response not typed
- No upload configuration interface
- No enum for upload types

#### 5. **Missing Tests**
- Zero unit tests
- Zero integration tests

#### 6. **Missing Documentation**
- No inline docs
- No usage examples
- No configuration guide

#### 7. **Security Issues**
- No file validation
- No virus scanning
- No rate limiting
- Hardcoded credentials in Cloudinary config

---

## 🛠️ Refactoring Tasks

### Phase 1: Upload Module (Priority: HIGH)

#### Task 1.1: Create DTOs
- `upload-file.dto.ts` - File upload request
- `upload-response.dto.ts` - Upload response
- `delete-file.dto.ts` - Delete request
- `image-transform.dto.ts` - Image optimization options

#### Task 1.2: Create Enums & Constants
- `upload.enum.ts` - File types, user types, mime types
- `upload.constants.ts` - Max sizes, allowed types

#### Task 1.3: Create Custom Exceptions
- `InvalidFileTypeException`
- `FileTooLargeException`
- `UploadFailedException`

#### Task 1.4: Add Validation Layer
- File type validation
- File size validation
- Image dimension validation
- Virus scanning (ClamAV integration)

#### Task 1.5: Add Image Optimization
- Automatic resizing
- Format conversion (WebP)
- Thumbnail generation
- Multiple variants (small, medium, large)

#### Task 1.6: Add Upload Policies
- Customer: 5MB max, profile photos only
- Vendor: 10MB max, shop/product images
- Admin: 20MB max, all types

#### Task 1.7: Add CDN Integration
- Signed URLs for private files
- URL expiration
- Cache headers

---

### Phase 2: Redis Module (Priority: MEDIUM)

#### Task 2.1: Add Configuration Management
- Environment-based config
- Connection pool settings
- Cluster support

#### Task 2.2: Add Monitoring
- Connection health metrics
- Operation latency tracking
- Memory usage alerts

#### Task 2.3: Add Advanced Features
- Pipeline operations
- Transactions (MULTI/EXEC)
- Pub/Sub support
- Lua script support

#### Task 2.4: Add Unit Tests
- Mock Redis client
- Test all operations
- Test error scenarios

---

### Phase 3: Cache Module (Priority: MEDIUM)

#### Task 3.1: Add Cache Strategies
- Write-through caching
- Write-behind caching
- Read-through caching
- Cache-aside pattern

#### Task 3.2: Add Cache Warming
- Preload frequently accessed data
- Schedule cache refresh
- Background cache updates

#### Task 3.3: Add Monitoring Dashboard
- Hit/miss rates per domain
- Memory usage
- TTL distribution
- Eviction metrics

#### Task 3.4: Add Unit Tests
- Test cache operations
- Test tag invalidation
- Test statistics

---

### Phase 4: RabbitMQ Module (Priority: LOW - Already Good)

#### Task 4.1: Add Message DTOs
- Event payload interfaces
- Message envelope types

#### Task 4.2: Add Dead Letter Queue Handling
- Retry logic
- Max retry count
- DLQ consumer

#### Task 4.3: Add Monitoring
- Message throughput
- Queue depth
- Consumer lag

#### Task 4.4: Add Unit Tests
- Mock AMQP connection
- Test publish/subscribe
- Test error scenarios

---

## 📋 Implementation Priority

### Week 1: Upload Module (CRITICAL)
**Why**: Required for Product Management (next phase)

- Day 1: DTOs, Enums, Constants
- Day 2: Validation layer, Custom exceptions
- Day 3: Image optimization, Multiple variants
- Day 4: Upload policies, CDN integration
- Day 5: Unit tests, Documentation

### Week 2: Redis & Cache Modules
**Why**: Performance optimization

- Day 1-2: Redis monitoring, Advanced features
- Day 3-4: Cache strategies, Warming
- Day 5: Unit tests for both modules

### Week 3: RabbitMQ Module
**Why**: Lower priority (already functional)

- Day 1-2: Message DTOs, DLQ handling
- Day 3: Monitoring
- Day 4-5: Unit tests, Documentation

---

## 🎯 Success Metrics

### Upload Module
- ✅ 100% file validation coverage
- ✅ Support 10+ file types
- ✅ Generate 3 image variants (thumbnail, medium, full)
- ✅ <2s upload time for 5MB files
- ✅ 90%+ unit test coverage

### Redis Module
- ✅ <10ms average operation latency
- ✅ 99.9% uptime
- ✅ Connection pool size: 10-50
- ✅ 90%+ unit test coverage

### Cache Module
- ✅ >80% cache hit rate
- ✅ <5ms cache lookup time
- ✅ Memory usage <500MB
- ✅ 90%+ unit test coverage

### RabbitMQ Module
- ✅ <100ms message delivery latency
- ✅ 99.9% message delivery success rate
- ✅ DLQ message count <1% of total
- ✅ 90%+ unit test coverage

---

## 📚 Best Practices to Apply

1. **DTOs Everywhere**: All inputs/outputs typed
2. **Custom Exceptions**: Domain-specific error handling
3. **Validation First**: Never trust input
4. **Security by Default**: Rate limiting, file scanning
5. **Performance Monitoring**: Metrics for everything
6. **Comprehensive Tests**: Unit + integration tests
7. **Documentation**: Inline docs + usage guides
8. **Configuration Management**: Environment-based, no hardcoding
9. **Logging**: Structured logging with context
10. **Error Recovery**: Graceful degradation, fallbacks

---

## 🚀 Let's Start!

**Recommended**: Start with Upload Module refactoring since it's needed for Product Management.

Ready to begin? I'll:
1. Create all DTOs and enums
2. Add validation layer
3. Implement image optimization
4. Add upload policies
5. Write comprehensive tests

---

**Document Version**: 1.0  
**Created**: November 2, 2025  
**Status**: Ready to implement
