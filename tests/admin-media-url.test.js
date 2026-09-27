import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveAdminMediaUrl,
  yjeekUploadsPathFromAbsoluteUrl,
} from '../src/mappers/admin/mapAdminUpload.js'

test('WordPress /wp-content/uploads URLs are not treated as Yjeek uploads', () => {
  const sultan =
    'https://sultansdinebd.com/wp-content/uploads/2025/04/Beef-Chap-Sultans-Dine-scaled.jpg'
  assert.equal(yjeekUploadsPathFromAbsoluteUrl(sultan), null)
  assert.equal(resolveAdminMediaUrl(sultan), sultan)
})

test('Yjeek /uploads paths still rewrite', () => {
  assert.equal(
    yjeekUploadsPathFromAbsoluteUrl('http://192.168.10.251:3000/uploads/menu/item.jpg'),
    '/uploads/menu/item.jpg',
  )
})

test('Webflow CDN menu images stay absolute', () => {
  const kacchi =
    'https://cdn.prod.website-files.com/63de61fd6af00b31333c0d3a/6827579bc165ae0a8cd9abc.jpg'
  assert.equal(yjeekUploadsPathFromAbsoluteUrl(kacchi), null)
  assert.equal(resolveAdminMediaUrl(kacchi), kacchi)
})
