class Message < ApplicationRecord
  belongs_to :room
  belongs_to :user
  has_many :ancestor_relationships, class_name: 'MessageRelationship', foreign_key: :child_id
  has_many :ancestors, through: :ancestor_relationships, source: :parent
  has_many :descendant_relationships, class_name: 'MessageRelationship', foreign_key: :parent_id
  has_many :descendants, through: :message_relationships, source: :child

  before_save do
    tags = []
    if content
      content.scan(/(?:\s|^)#(\S+)/) do |tag, _|
        tags << tag
      end
    end
    meta[:tags] = tags
  end

  scope :tags, -> (*tags) {
    return all if tags.blank?
    where('meta->\'tags\' @> ?', tags.to_json)
  }
  scope :no_tags, -> (*tags) {
    return all if tags.blank?
    q = all
    tags.each do |tag|
      q = q.where.not('meta->\'tags\' @> ?', [tag].to_json)
    end
    q.or(where('meta->\'tags\' is NULL'))
  }

  scope :query, -> (query) {
    return all if query.blank?
    ts = query.scan(/(?:\s|^)([^\!]\S+)/).map {|tag, _| tag }
    q = all.tags(*ts)
    nts = query.scan(/(?:\s|^)\!(\S+)/).map {|tag, _| tag }
    q.no_tags(*nts)
  }
end
