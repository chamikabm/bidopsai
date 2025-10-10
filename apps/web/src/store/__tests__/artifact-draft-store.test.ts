import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useArtifactDraftStore } from '../artifact-draft-store'

describe('Artifact Draft Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useArtifactDraftStore())
    act(() => {
      result.current.clearAllDrafts()
    })
  })

  describe('Draft Operations', () => {
    it('has no drafts by default', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      expect(result.current.getDraftCount()).toBe(0)
    })

    it('sets draft', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      const content = { type: 'doc', content: [] }
      
      act(() => {
        result.current.setDraft('artifact-1', content)
      })
      
      const draft = result.current.getDraft('artifact-1')
      expect(draft).toBeDefined()
      expect(draft?.artifactId).toBe('artifact-1')
      expect(draft?.content).toEqual(content)
      expect(draft?.hasChanges).toBe(true)
    })

    it('gets draft', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      const content = { type: 'doc', content: [] }
      
      act(() => {
        result.current.setDraft('artifact-1', content)
      })
      
      const draft = result.current.getDraft('artifact-1')
      expect(draft?.content).toEqual(content)
    })

    it('clears draft', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { test: 'data' })
        result.current.clearDraft('artifact-1')
      })
      
      expect(result.current.getDraft('artifact-1')).toBeUndefined()
    })

    it('clears all drafts', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { test: 'data1' })
        result.current.setDraft('artifact-2', { test: 'data2' })
        result.current.clearAllDrafts()
      })
      
      expect(result.current.getDraftCount()).toBe(0)
    })

    it('checks if draft exists', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { test: 'data' })
      })
      
      expect(result.current.hasDraft('artifact-1')).toBe(true)
      expect(result.current.hasDraft('artifact-2')).toBe(false)
    })

    it('counts drafts', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { test: 'data1' })
        result.current.setDraft('artifact-2', { test: 'data2' })
      })
      
      expect(result.current.getDraftCount()).toBe(2)
    })
  })

  describe('Version Control', () => {
    it('saves draft version', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { version: 1 })
        result.current.saveDraftVersion('artifact-1', 'Version 1')
      })
      
      const versions = result.current.getDraftVersions('artifact-1')
      expect(versions).toHaveLength(1)
      expect(versions[0].label).toBe('Version 1')
    })

    it('saves multiple versions', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { version: 1 })
        result.current.saveDraftVersion('artifact-1', 'Version 1')
        
        result.current.setDraft('artifact-1', { version: 2 })
        result.current.saveDraftVersion('artifact-1', 'Version 2')
      })
      
      const versions = result.current.getDraftVersions('artifact-1')
      expect(versions).toHaveLength(2)
    })

    it('restores draft version', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { version: 1 })
        result.current.saveDraftVersion('artifact-1', 'Version 1')
        
        result.current.setDraft('artifact-1', { version: 2 })
      })
      
      const versions = result.current.getDraftVersions('artifact-1')
      const versionId = versions[0].id
      
      act(() => {
        result.current.restoreDraftVersion('artifact-1', versionId)
      })
      
      const draft = result.current.getDraft('artifact-1')
      expect(draft?.content).toEqual({ version: 1 })
    })

    it('deletes draft version', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { version: 1 })
        result.current.saveDraftVersion('artifact-1', 'Version 1')
      })
      
      const versions = result.current.getDraftVersions('artifact-1')
      const versionId = versions[0].id
      
      act(() => {
        result.current.deleteDraftVersion('artifact-1', versionId)
      })
      
      expect(result.current.getDraftVersions('artifact-1')).toHaveLength(0)
    })

    it('clears all versions for artifact', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { version: 1 })
        result.current.saveDraftVersion('artifact-1', 'Version 1')
        result.current.saveDraftVersion('artifact-1', 'Version 2')
        result.current.clearDraftVersions('artifact-1')
      })
      
      expect(result.current.getDraftVersions('artifact-1')).toHaveLength(0)
    })
  })

  describe('Comparison Operations', () => {
    it('detects unsaved changes', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { original: true })
      })
      
      // Initially no changes (content equals original)
      expect(result.current.hasUnsavedChanges('artifact-1')).toBe(false)
      
      act(() => {
        result.current.setDraft('artifact-1', { modified: true })
      })
      
      // Now has changes
      expect(result.current.hasUnsavedChanges('artifact-1')).toBe(true)
    })

    it('resets to original content', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      const originalContent = { original: true }
      
      act(() => {
        result.current.setDraft('artifact-1', originalContent)
        result.current.setDraft('artifact-1', { modified: true })
        result.current.resetToOriginal('artifact-1')
      })
      
      const draft = result.current.getDraft('artifact-1')
      expect(draft?.content).toEqual(originalContent)
      expect(draft?.hasChanges).toBe(false)
    })
  })

  describe('Batch Operations', () => {
    it('sets multiple drafts', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setMultipleDrafts([
          { artifactId: 'artifact-1', content: { data: 1 } },
          { artifactId: 'artifact-2', content: { data: 2 } },
        ])
      })
      
      expect(result.current.getDraftCount()).toBe(2)
      expect(result.current.getDraft('artifact-1')?.content).toEqual({ data: 1 })
      expect(result.current.getDraft('artifact-2')?.content).toEqual({ data: 2 })
    })

    it('clears multiple drafts', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { data: 1 })
        result.current.setDraft('artifact-2', { data: 2 })
        result.current.setDraft('artifact-3', { data: 3 })
        result.current.clearMultipleDrafts(['artifact-1', 'artifact-2'])
      })
      
      expect(result.current.getDraftCount()).toBe(1)
      expect(result.current.hasDraft('artifact-1')).toBe(false)
      expect(result.current.hasDraft('artifact-2')).toBe(false)
      expect(result.current.hasDraft('artifact-3')).toBe(true)
    })
  })

  describe('Version Number Tracking', () => {
    it('tracks version number', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { data: 'test' }, 5)
      })
      
      const draft = result.current.getDraft('artifact-1')
      expect(draft?.versionNumber).toBe(5)
    })

    it('updates version number', () => {
      const { result } = renderHook(() => useArtifactDraftStore())
      
      act(() => {
        result.current.setDraft('artifact-1', { data: 'test' }, 5)
        result.current.setDraft('artifact-1', { data: 'updated' }, 6)
      })
      
      const draft = result.current.getDraft('artifact-1')
      expect(draft?.versionNumber).toBe(6)
    })
  })
})
