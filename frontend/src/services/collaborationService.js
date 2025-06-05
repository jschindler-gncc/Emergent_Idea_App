// Cross-Tenant Collaboration Service
class CollaborationService {
  constructor() {
    this.STORAGE_KEYS = {
      SHARED_IDEAS: 'shared_ideas',
      VIRTUAL_TEAMS: 'virtual_teams',
      COLLABORATION_SESSIONS: 'collaboration_sessions',
      COMMENTS: 'idea_comments',
      PARTNERSHIPS: 'partnerships',
      MARKETPLACE: 'public_marketplace'
    };
  }

  // Cross-Tenant Idea Sharing
  async shareIdea(ideaId, fromTenantId, toTenantId, shareType, permissions) {
    try {
      const sharedIdea = {
        id: `shared_${Date.now()}`,
        originalIdeaId: ideaId,
        fromTenantId,
        toTenantId,
        shareType, // 'private', 'team', 'marketplace', 'partnership'
        permissions, // ['view', 'comment', 'edit', 'fork']
        status: shareType === 'marketplace' ? 'public' : 'pending',
        sharedAt: new Date().toISOString(),
        metrics: {
          views: 0,
          comments: 0,
          forks: 0,
          likes: 0
        }
      };

      const sharedIdeas = this.getSharedIdeas();
      sharedIdeas.push(sharedIdea);
      this.saveSharedIdeas(sharedIdeas);

      // Notify receiving tenant if not marketplace
      if (shareType !== 'marketplace') {
        await this.notifyTenantOfShare(toTenantId, sharedIdea);
      }

      return { success: true, sharedIdea };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async acceptIdeaShare(shareId, tenantId) {
    try {
      const sharedIdeas = this.getSharedIdeas();
      const shareIndex = sharedIdeas.findIndex(s => s.id === shareId);
      
      if (shareIndex === -1) {
        throw new Error('Share not found');
      }

      sharedIdeas[shareIndex].status = 'accepted';
      sharedIdeas[shareIndex].acceptedAt = new Date().toISOString();
      
      this.saveSharedIdeas(sharedIdeas);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async forkIdea(shareId, targetTenantId, userId) {
    try {
      const sharedIdeas = this.getSharedIdeas();
      const share = sharedIdeas.find(s => s.id === shareId);
      
      if (!share || !share.permissions.includes('fork')) {
        throw new Error('Fork permission denied');
      }

      // Create forked idea
      const originalIdea = this.getOriginalIdea(share.originalIdeaId);
      const forkedIdea = {
        ...originalIdea,
        id: `idea_${Date.now()}`,
        tenantId: targetTenantId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        forkedFrom: {
          originalId: share.originalIdeaId,
          fromTenant: share.fromTenantId,
          shareId: shareId
        },
        title: `[Forked] ${originalIdea.title}`
      };

      // Update fork metrics
      share.metrics.forks++;
      this.saveSharedIdeas(sharedIdeas);

      return { success: true, forkedIdea };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Virtual Teams (Cross-Tenant)
  async createVirtualTeam(teamData, creatorTenantId, creatorUserId) {
    try {
      const virtualTeam = {
        id: `vteam_${Date.now()}`,
        name: teamData.name,
        description: teamData.description,
        creatorTenantId,
        creatorUserId,
        members: [{
          userId: creatorUserId,
          tenantId: creatorTenantId,
          role: 'owner',
          joinedAt: new Date().toISOString()
        }],
        tenants: [creatorTenantId],
        status: 'active',
        createdAt: new Date().toISOString(),
        settings: {
          isPublic: teamData.isPublic || false,
          allowCrossTenantInvites: true,
          maxMembers: teamData.maxMembers || 50,
          projectDuration: teamData.projectDuration || null
        },
        metrics: {
          totalIdeas: 0,
          activeMembers: 1,
          collaborationEvents: 0
        }
      };

      const virtualTeams = this.getVirtualTeams();
      virtualTeams.push(virtualTeam);
      this.saveVirtualTeams(virtualTeams);

      return { success: true, team: virtualTeam };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async inviteToVirtualTeam(teamId, inviteeEmail, inviteeTenantId, role = 'member') {
    try {
      const teams = this.getVirtualTeams();
      const team = teams.find(t => t.id === teamId);
      
      if (!team) {
        throw new Error('Team not found');
      }

      const invitation = {
        id: `vinvite_${Date.now()}`,
        teamId,
        email: inviteeEmail,
        tenantId: inviteeTenantId,
        role,
        status: 'pending',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Store invitation
      const invitations = this.getVirtualTeamInvitations();
      invitations.push(invitation);
      localStorage.setItem('virtual_team_invitations', JSON.stringify(invitations));

      return { success: true, invitation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async joinVirtualTeam(invitationId, userId) {
    try {
      const invitations = this.getVirtualTeamInvitations();
      const invitation = invitations.find(inv => inv.id === invitationId);
      
      if (!invitation || invitation.status !== 'pending') {
        throw new Error('Invalid invitation');
      }

      const teams = this.getVirtualTeams();
      const teamIndex = teams.findIndex(t => t.id === invitation.teamId);
      
      if (teamIndex === -1) {
        throw new Error('Team not found');
      }

      // Add member to team
      teams[teamIndex].members.push({
        userId,
        tenantId: invitation.tenantId,
        role: invitation.role,
        joinedAt: new Date().toISOString()
      });

      // Add tenant to team if not already present
      if (!teams[teamIndex].tenants.includes(invitation.tenantId)) {
        teams[teamIndex].tenants.push(invitation.tenantId);
      }

      teams[teamIndex].metrics.activeMembers++;
      
      this.saveVirtualTeams(teams);

      // Mark invitation as accepted
      invitation.status = 'accepted';
      localStorage.setItem('virtual_team_invitations', JSON.stringify(invitations));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Real-time Collaboration
  async startCollaborationSession(ideaId, userId, tenantId) {
    try {
      const session = {
        id: `session_${Date.now()}`,
        ideaId,
        initiatorUserId: userId,
        initiatorTenantId: tenantId,
        participants: [{
          userId,
          tenantId,
          joinedAt: new Date().toISOString(),
          status: 'active'
        }],
        startedAt: new Date().toISOString(),
        status: 'active',
        changes: []
      };

      const sessions = this.getCollaborationSessions();
      sessions.push(session);
      this.saveCollaborationSessions(sessions);

      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async joinCollaborationSession(sessionId, userId, tenantId) {
    try {
      const sessions = this.getCollaborationSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }

      // Add participant
      sessions[sessionIndex].participants.push({
        userId,
        tenantId,
        joinedAt: new Date().toISOString(),
        status: 'active'
      });

      this.saveCollaborationSessions(sessions);

      return { success: true, session: sessions[sessionIndex] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async recordCollaborationChange(sessionId, change) {
    try {
      const sessions = this.getCollaborationSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }

      sessions[sessionIndex].changes.push({
        ...change,
        timestamp: new Date().toISOString()
      });

      this.saveCollaborationSessions(sessions);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Comments and Discussions
  async addComment(ideaId, userId, tenantId, content, parentCommentId = null) {
    try {
      const comment = {
        id: `comment_${Date.now()}`,
        ideaId,
        userId,
        tenantId,
        content,
        parentCommentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        replies: []
      };

      const comments = this.getComments();
      comments.push(comment);
      this.saveComments(comments);

      return { success: true, comment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getIdeaComments(ideaId) {
    const comments = this.getComments();
    return comments.filter(c => c.ideaId === ideaId);
  }

  // Public Marketplace
  async publishToMarketplace(ideaId, tenantId, pricing = null) {
    try {
      const marketplaceItem = {
        id: `market_${Date.now()}`,
        ideaId,
        tenantId,
        pricing, // { type: 'free' | 'paid', amount: number, currency: 'USD' }
        publishedAt: new Date().toISOString(),
        status: 'active',
        metrics: {
          views: 0,
          downloads: 0,
          likes: 0,
          revenue: 0
        },
        categories: [],
        tags: []
      };

      const marketplace = this.getMarketplace();
      marketplace.push(marketplaceItem);
      this.saveMarketplace(marketplace);

      return { success: true, item: marketplaceItem };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  searchMarketplace(query, filters = {}) {
    const marketplace = this.getMarketplace();
    
    return marketplace.filter(item => {
      let matches = true;
      
      // Text search
      if (query) {
        const idea = this.getOriginalIdea(item.ideaId);
        const searchText = `${idea.title} ${idea.content}`.toLowerCase();
        matches = matches && searchText.includes(query.toLowerCase());
      }
      
      // Category filter
      if (filters.category && item.categories.length > 0) {
        matches = matches && item.categories.includes(filters.category);
      }
      
      // Pricing filter
      if (filters.pricing) {
        matches = matches && item.pricing?.type === filters.pricing;
      }
      
      return matches;
    });
  }

  // Storage Methods
  getSharedIdeas() {
    try {
      const ideas = localStorage.getItem(this.STORAGE_KEYS.SHARED_IDEAS);
      return ideas ? JSON.parse(ideas) : [];
    } catch {
      return [];
    }
  }

  saveSharedIdeas(ideas) {
    localStorage.setItem(this.STORAGE_KEYS.SHARED_IDEAS, JSON.stringify(ideas));
  }

  getVirtualTeams() {
    try {
      const teams = localStorage.getItem(this.STORAGE_KEYS.VIRTUAL_TEAMS);
      return teams ? JSON.parse(teams) : [];
    } catch {
      return [];
    }
  }

  saveVirtualTeams(teams) {
    localStorage.setItem(this.STORAGE_KEYS.VIRTUAL_TEAMS, JSON.stringify(teams));
  }

  getVirtualTeamInvitations() {
    try {
      const invitations = localStorage.getItem('virtual_team_invitations');
      return invitations ? JSON.parse(invitations) : [];
    } catch {
      return [];
    }
  }

  getCollaborationSessions() {
    try {
      const sessions = localStorage.getItem(this.STORAGE_KEYS.COLLABORATION_SESSIONS);
      return sessions ? JSON.parse(sessions) : [];
    } catch {
      return [];
    }
  }

  saveCollaborationSessions(sessions) {
    localStorage.setItem(this.STORAGE_KEYS.COLLABORATION_SESSIONS, JSON.stringify(sessions));
  }

  getComments() {
    try {
      const comments = localStorage.getItem(this.STORAGE_KEYS.COMMENTS);
      return comments ? JSON.parse(comments) : [];
    } catch {
      return [];
    }
  }

  saveComments(comments) {
    localStorage.setItem(this.STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  }

  getMarketplace() {
    try {
      const marketplace = localStorage.getItem(this.STORAGE_KEYS.MARKETPLACE);
      return marketplace ? JSON.parse(marketplace) : [];
    } catch {
      return [];
    }
  }

  saveMarketplace(marketplace) {
    localStorage.setItem(this.STORAGE_KEYS.MARKETPLACE, JSON.stringify(marketplace));
  }

  // Helper methods
  getOriginalIdea(ideaId) {
    // This would fetch from the main ideas storage
    const ideas = JSON.parse(localStorage.getItem('idea-logger-data') || '[]');
    return ideas.find(idea => idea.id === ideaId);
  }

  async notifyTenantOfShare(tenantId, sharedIdea) {
    // In real implementation, this would send notifications
    console.log(`Notifying tenant ${tenantId} of new shared idea`, sharedIdea);
  }
}

export default new CollaborationService();