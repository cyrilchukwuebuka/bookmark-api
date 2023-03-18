import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';
import * as request from 'supertest';
import { AuthDto } from '../src/auth/dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { EditUserDto } from '../src/user/dto';
import { AppModule } from './../src/app.module';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let access_token: string;

  beforeAll(async () => {
    jest.setTimeout(15000);
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    app.useGlobalFilters();

    await app.init();
    await app.listen(4001);

    try {
      prisma = app.get(PrismaService);
      await prisma.cleanDb();
    } catch (error) {
      console.log(error);
    }
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'muofunanya@gmail.com',
      password: '123',
    };

    describe('Signup', () => {
      it('should throw exception if email is empty', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            password: dto.password,
          })
          .expect(400);
      });

      it('should throw exception if password is empty', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: dto.email,
          })
          .expect(400);
      });

      it('should throw exception if empty body', () => {
        return request(app.getHttpServer()).post('/auth/signup').expect(400);
      });

      it('should signup', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send(dto)
          .expect(201)
          .expect((response) => {
            access_token = response.body['access_token'];
            expect(response.body).toHaveProperty('access_token');
          });
      });
    });

    describe('Login', () => {
      it('should throw exception if email is empty', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            password: dto.password,
          })
          .expect(400);
      });

      it('should throw exception if password is empty', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: dto.email,
          })
          .expect(400);
      });

      it('should throw exception if empty body', () => {
        return request(app.getHttpServer()).post('/auth/login').expect(400);
      });

      it('should signup', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send(dto)
          .expect(200)
          .expect((response) => {
            access_token = response.body['access_token'];
            expect(response.body).toHaveProperty('access_token');
          });
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should not get current user', () => {
        return request(app.getHttpServer()).get('/users/me').expect(401);
      });

      it('should get current user', () => {
        return request(app.getHttpServer())
          .get('/users/me')
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200);
      });
    });

    describe('Edit user', () => {
      const dto: Partial<EditUserDto> = {
        email: 'muofunanya1@gmail.com',
      };

      it('should edit current user', () => {
        return request(app.getHttpServer())
          .patch('/users')
          .set('Authorization', 'Bearer ' + access_token)
          .send(dto)
          .expect(200);
      });

      it('should get current user', () => {
        return request(app.getHttpServer())
          .get('/users/me')
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200)
          .expect((response) => {
            expect(response.body).toHaveProperty('id');
          });
      });
    });
  });

  describe('Bookmarks', () => {
    let bookmarkId: number;

    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks', () => {
        return request(app.getHttpServer())
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200)
          .expect((response) => {
            expect(response.body).toEqual([]);
          });
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://google.com/',
        description: 'Bookmark initial population',
      };

      it('should get empty bookmarks', () => {
        return request(app.getHttpServer())
          .post('/bookmarks')
          .set('Authorization', 'Bearer ' + access_token)
          .send(dto)
          .expect(201)
          .expect((response) => {
            bookmarkId = response.body['id'];
            expect(response.body['description']).toBe(dto.description);
          });
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return request(app.getHttpServer())
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200)
          .expect((response) => {
            expect(response.body.length).toBeGreaterThanOrEqual(1);
          });
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return request(app.getHttpServer())
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200)
          .expect((response) => {
            expect(response.body['id']).toBe(bookmarkId);
          });
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: Partial<EditBookmarkDto> = {
        title: 'First Bookmark',
        link: 'https://google.com/',
        description: 'Bookmark edited',
      };

      it('should edit bookmark by id', () => {
        return request(app.getHttpServer())
          .patch(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + access_token)
          .send(dto)
          .expect(200)
          .expect((response) => {
            console.log(response.body);
            expect(response.body['description']).toBe(dto.description);
          });
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete bookmark by id', () => {
        return request(app.getHttpServer())
          .delete(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + access_token)
          .expect(204);
      });

      it('should get empty bookmarks', () => {
        return request(app.getHttpServer())
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200)
          .expect((response) => {
            expect(response.body).toEqual([]);
          });
      });
    });
  });
});
