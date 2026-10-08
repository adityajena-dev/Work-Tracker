import React, { useState, useEffect, useMemo } from 'react';
import { BlouseWork, CapacitySettings, ActiveTab, GivenOutBatch } from './types/work';
import { 
  loadWorkItems, 
  saveWorkItems, 
  loadCapacitySettings, 
  saveCapacitySettings,
  isOnboardingCompleted,
  setOnboardingCompleted,
  loadGivenOutBatches,
  saveGivenOutBatches,
  loadTempGivenOutBatch,
  saveTempGivenOutBatch
} from './utils/storage';
import { rankWorkItems } from './utils/priority';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { WorkList } from './components/WorkList';
import { TodayPlan } from './components/TodayPlan';
import { CompletedHistory } from './components/CompletedHistory';
import { BottomNav } from './components/BottomNav';
import { CapacityModal } from './components/CapacityModal';
import { AddEditWorkModal } from './components/AddEditWorkModal';
import { WorkDetailModal } from './components/WorkDetailModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { BlousePlannerBackup } from './utils/backup';

export const App: React.FC = () => {
  // 1. Onboarding State (shown only to brand new users)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => isOnboardingCompleted());

  // 2. Core State
  const [workItems, setWorkItems] = useState<BlouseWork[]>(() => loadWorkItems());
  const [capacity, setCapacity] = useState<CapacitySettings>(() => loadCapacitySettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Given Out state: confirmed batches and current temporary unconfirmed batch
  const [givenOutBatches, setGivenOutBatches] = useState<GivenOutBatch[]>(() => loadGivenOutBatches());
  const [tempGivenOutBatch, setTempGivenOutBatch] = useState<number>(() => loadTempGivenOutBatch());

  // 3. Modals & Detail View State
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<BlouseWork | null>(null);
  const [detailWork, setDetailWork] = useState<BlouseWork | null>(null);

  // 4. Persistence
  useEffect(() => {
    saveWorkItems(workItems);
  }, [workItems]);

  useEffect(() => {
    saveCapacitySettings(capacity);
  }, [capacity]);

  useEffect(() => {
    saveGivenOutBatches(givenOutBatches);
  }, [givenOutBatches]);

  useEffect(() => {
    saveTempGivenOutBatch(tempGivenOutBatch);
  }, [tempGivenOutBatch]);

  // 5. Priority Ranking & Separation
  const rankedItems = useMemo(() => {
    return rankWorkItems(workItems, capacity);
  }, [workItems, capacity]);

  const completedItems = useMemo(() => {
    return workItems
      .filter((w) => w.completedQuantity >= w.totalQuantity)
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [workItems]);

  // Keep detailWork updated if items change
  const currentDetailItem = useMemo(() => {
    if (!detailWork) return null;
    return workItems.find((w) => w.id === detailWork.id) || null;
  }, [detailWork, workItems]);

  // 6. Action Handlers
  const handleOnboardingComplete = (firstBlouse: BlouseWork, initialCapacity: CapacitySettings) => {
    setCapacity(initialCapacity);
    saveCapacitySettings(initialCapacity);

    setWorkItems([firstBlouse]);
    saveWorkItems([firstBlouse]);

    setOnboardingCompleted(true);
    setHasCompletedOnboarding(true);
    setActiveTab('home');
  };

  // Given Out batching handlers
  const handleIncrementTempBatch = () => {
    setTempGivenOutBatch((prev) => prev + 1);
  };

  const handleDecrementTempBatch = () => {
    setTempGivenOutBatch((prev) => Math.max(0, prev - 1));
  };

  const handleConfirmBatch = () => {
    if (tempGivenOutBatch <= 0) return;
    const newBatch: GivenOutBatch = {
      id: 'batch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      quantity: tempGivenOutBatch,
      confirmedAt: new Date().toISOString()
    };
    setGivenOutBatches((prev) => [...prev, newBatch]);
    setTempGivenOutBatch(0);
  };


  const handleIncrementCompleted = (id: string) => {
    setWorkItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newCompleted = Math.min(item.totalQuantity, item.completedQuantity + 1);
        const isNowFinished = newCompleted >= item.totalQuantity;
        return {
          ...item,
          completedQuantity: newCompleted,
          completedAt: isNowFinished ? new Date().toISOString() : item.completedAt
        };
      })
    );
  };

  const handleDecrementCompleted = (id: string) => {
    setWorkItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newCompleted = Math.max(0, item.completedQuantity - 1);
        return {
          ...item,
          completedQuantity: newCompleted,
          completedAt: undefined // Re-opened if decremented
        };
      })
    );
  };

  const handleMarkAllComplete = (id: string) => {
    setWorkItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          completedQuantity: item.totalQuantity,
          completedAt: new Date().toISOString()
        };
      })
    );
    setDetailWork(null);
  };

  const handleReopenWork = (id: string) => {
    setWorkItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          completedQuantity: Math.max(0, item.totalQuantity - 1),
          completedAt: undefined
        };
      })
    );
  };

  const handleSaveWork = (workData: Omit<BlouseWork, 'id' | 'createdAt'> & { id?: string }) => {
    if (workData.id) {
      setWorkItems((prev) =>
        prev.map((item) =>
          item.id === workData.id
            ? {
                ...item,
                ...workData,
                id: item.id,
                createdAt: item.createdAt
              }
            : item
        )
      );
    } else {
      const newItem: BlouseWork = {
        ...workData,
        id: 'work-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString()
      };
      setWorkItems((prev) => [newItem, ...prev]);
    }
  };

  const handleDeleteWork = (id: string) => {
    setWorkItems((prev) => prev.filter((item) => item.id !== id));
    if (detailWork?.id === id) {
      setDetailWork(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear completed work?')) {
      const remainingActive = workItems.filter(w => w.completedQuantity < w.totalQuantity);
      setWorkItems(remainingActive);
    }
  };

  const handleRestoreBackup = (backup: BlousePlannerBackup) => {
    // Immediately synchronize React state so restored data appears right away without page reload
    setWorkItems(backup.data.workItems);
    setCapacity(backup.data.capacitySettings);
    setGivenOutBatches(backup.data.givenOutBatches || []);
    setTempGivenOutBatch(backup.data.tempGivenOutBatch || 0);
    setHasCompletedOnboarding(backup.data.onboardingCompleted);
  };

  // If first time user, show 3-step onboarding flow
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-[#1c1917]">
      {/* Top Header */}
      <Header
        capacity={capacity}
        onOpenCapacity={() => setIsCapacityModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'home' && (
          <Dashboard
            rankedItems={rankedItems}
            capacity={capacity}
            onIncrementCompleted={handleIncrementCompleted}
            onDecrementCompleted={handleDecrementCompleted}
            onOpenDetails={(work) => setDetailWork(work)}
            onOpenAddModal={() => {
              setEditingWork(null);
              setIsAddEditModalOpen(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
            givenOutBatches={givenOutBatches}
            tempGivenOutBatch={tempGivenOutBatch}
            onIncrementTempBatch={handleIncrementTempBatch}
            onDecrementTempBatch={handleDecrementTempBatch}
            onConfirmBatch={handleConfirmBatch}
          />
        )}


        {activeTab === 'work' && (
          <WorkList
            rankedItems={rankedItems}
            onIncrementCompleted={handleIncrementCompleted}
            onOpenDetails={(work) => setDetailWork(work)}
            onOpenAddModal={() => {
              setEditingWork(null);
              setIsAddEditModalOpen(true);
            }}
          />
        )}

        {activeTab === 'today' && (
          <TodayPlan
            workItems={workItems}
            capacity={capacity}
            onIncrementCompleted={handleIncrementCompleted}
            onOpenDetails={(work) => setDetailWork(work)}
            onOpenCapacity={() => setIsCapacityModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <CompletedHistory
            completedItems={completedItems}
            onReopenWork={handleReopenWork}
            onClearAll={handleClearAll}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAddModal={() => {
          setEditingWork(null);
          setIsAddEditModalOpen(true);
        }}
      />

      {/* Modals */}
      <CapacityModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        currentCapacity={capacity}
        onSave={(newSettings) => setCapacity(newSettings)}
        onRestoreBackup={handleRestoreBackup}
      />

      <AddEditWorkModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingWork(null);
        }}
        onSave={handleSaveWork}
        initialWork={editingWork}
      />

      <WorkDetailModal
        work={currentDetailItem}
        isOpen={!!currentDetailItem}
        onClose={() => setDetailWork(null)}
        capacity={capacity}
        onIncrementCompleted={handleIncrementCompleted}
        onDecrementCompleted={handleDecrementCompleted}
        onMarkAllComplete={handleMarkAllComplete}
        onEdit={(work) => {
          setDetailWork(null);
          setEditingWork(work);
          setIsAddEditModalOpen(true);
        }}
        onDelete={handleDeleteWork}
      />
    </div>
  );
};

export default App;
