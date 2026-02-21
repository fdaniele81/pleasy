import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import DistributionTable from '../../../shared/components/DistributionTable';
import { useUpdateEstimateMutation } from '../../estimator/api/estimateEndpoints';
import { extractCategoriesFromConfig } from '../utils/categoryConfig';

const PHASE_DEFS = [
  { key: 'analysis', labelKey: 'phaseAnalysis' },
  { key: 'development', labelKey: 'phaseDevelopment' },
  { key: 'internal_test', labelKey: 'phaseInternalTest' },
  { key: 'uat', labelKey: 'phaseUAT' },
  { key: 'release', labelKey: 'phaseRelease' },
  { key: 'documentation', labelKey: 'phaseDocumentation' },
  { key: 'startup', labelKey: 'phaseStartup' },
  { key: 'pm', labelKey: 'phasePM' },
];

const DistributionConfigModal = ({
  isOpen,
  onClose,
  estimateItem,
  onSave,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const PHASES = PHASE_DEFS.map(p => ({ key: p.key, label: t('capacityPlan:' + p.labelKey) }));
  const [distribution, setDistribution] = useState({});
  const [categoryKeys, setCategoryKeys] = useState([]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [updateEstimateMutation] = useUpdateEstimateMutation();

  // Inizializza dalla stima quando si apre la modale
  useEffect(() => {
    if (!isOpen || !estimateItem) return;

    const config = estimateItem.estimate?.effective_phase_config || {};

    const cats = extractCategoriesFromConfig(config);
    const allCats = new Set(cats.length > 0 ? cats : ['functional', 'technical', 'governance']);

    const keys = [...allCats];
    setCategoryKeys(keys);

    const dist = {};
    PHASES.forEach((phase) => {
      dist[phase.key] = {};
      keys.forEach((cat) => {
        dist[phase.key][cat] = config[phase.key]?.distribution?.[cat] || 0;
      });
    });
    setDistribution(dist);
    setError(null);
  }, [isOpen, estimateItem]);

  const getRowSum = (phaseKey) => {
    if (!distribution[phaseKey]) return 0;
    return Object.values(distribution[phaseKey]).reduce((sum, v) => sum + (v || 0), 0);
  };

  const validate = () => {
    for (const phase of PHASES) {
      const sum = getRowSum(phase.key);
      if (Math.abs(sum - 100) > 0.01) {
        return t('capacityPlan:phaseValidationError', { phase: phase.label, sum });
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!estimateItem) return;

    setIsSaving(true);
    setError(null);

    try {
      const { estimateId, estimate } = estimateItem;
      const currentConfig = estimate?.effective_phase_config || {};
      const updatedConfig = { ...currentConfig };

      PHASES.forEach((phase) => {
        updatedConfig[phase.key] = {
          ...updatedConfig[phase.key],
          distribution: { ...distribution[phase.key] },
        };
      });

      await updateEstimateMutation({
        id: estimateId,
        data: { estimate_phase_config: updatedConfig },
      }).unwrap();

      onSave({ [estimateId]: updatedConfig });
    } catch (err) {
      console.error('Errore salvataggio distribuzione:', err);
      setError(t('capacityPlan:savingError'));
    } finally {
      setIsSaving(false);
    }
  };

  const estimateTitle = estimateItem?.estimate?.title || '';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSave}
      title={t('capacityPlan:distributionSkills', { title: estimateTitle })}
      icon={<Settings className="text-cyan-600" size={24} />}
      size="xl"
      isSubmitting={isSaving}
      confirmText={t('capacityPlan:saveAndRecalc')}
      error={error}
    >
      <DistributionTable
        phases={PHASES}
        distribution={distribution}
        onDistributionChange={setDistribution}
        categoryKeys={categoryKeys}
        onCategoryKeysChange={setCategoryKeys}
        onError={setError}
      />
    </BaseModal>
  );
};

export default DistributionConfigModal;
