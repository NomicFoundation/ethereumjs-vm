import { createSuite } from './suite'
import { LevelDB } from './engines/level'
import { MapDB } from '@nomicfoundation/ethereumjs-util'

createSuite(new MapDB())
createSuite(new LevelDB())
